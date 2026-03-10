/**
 * Daemon entry point for iflow-to-im-skill.
 *
 * Assembles all DI implementations and starts the bridge.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { initBridgeContext } from 'claude-to-im/src/lib/bridge/context.js';
import * as bridgeManager from 'claude-to-im/src/lib/bridge/bridge-manager.js';
// Side-effect import to trigger adapter self-registration
import 'claude-to-im/src/lib/bridge/adapters/index.js';

import type { LLMProvider } from 'claude-to-im/src/lib/bridge/host.js';
import { loadConfig, configToSettings, ITI_HOME } from './config.js';
import type { Config } from './config.js';
import { JsonFileStore } from './store.js';
import { SDKLLMProvider, IflowDirectProvider, resolveIflowCliPath } from './llm-provider.js';
import { PendingPermissions } from './permission-gateway.js';
import { setupLogger } from './logger.js';

const RUNTIME_DIR = path.join(ITI_HOME, 'runtime');
const STATUS_FILE = path.join(RUNTIME_DIR, 'status.json');
const PID_FILE = path.join(RUNTIME_DIR, 'bridge.pid');

/**
 * Resolve the LLM provider based on the runtime setting.
 * - 'iflow' (default): uses iFlow CLI
 * - 'codex': uses @openai/codex-sdk via CodexProvider
 * - 'auto': tries iFlow first, falls back to Codex
 */
async function resolveProvider(config: Config, pendingPerms: PendingPermissions): Promise<LLMProvider> {
  const runtime = config.runtime;

  if (runtime === 'codex') {
    const { CodexProvider } = await import('./codex-provider.js');
    return new CodexProvider(pendingPerms);
  }

  if (runtime === 'auto') {
    const cliPath = resolveIflowCliPath();
    if (cliPath) {
      console.log(`[iflow-to-im] Auto: using iFlow CLI at ${cliPath}`);
      return new IflowDirectProvider(pendingPerms, cliPath);
    }
    console.log('[iflow-to-im] Auto: iFlow CLI not found, falling back to Codex');
    const { CodexProvider } = await import('./codex-provider.js');
    return new CodexProvider(pendingPerms);
  }

  // Default: iflow - use direct provider (SDK is for Claude Code CLI, not iFlow CLI)
  const cliPath = resolveIflowCliPath();
  if (!cliPath) {
    console.error(
      '[iflow-to-im] FATAL: Cannot find the `iflow` CLI executable.\n' +
      '  Tried: ITI_IFLOW_CLI_EXECUTABLE env, /usr/local/bin/iflow, /opt/homebrew/bin/iflow, ~/.npm-global/bin/iflow, ~/.local/bin/iflow\n' +
      '  Fix: Install iFlow CLI or set ITI_IFLOW_CLI_EXECUTABLE=/path/to/iflow\n' +
      '  Or: Set ITI_RUNTIME=codex to use Codex instead',
    );
    process.exit(1);
  }
  console.log(`[iflow-to-im] Using iFlow CLI (direct): ${cliPath}`);
  return new IflowDirectProvider(pendingPerms, cliPath);
}

interface StatusInfo {
  running: boolean;
  pid?: number;
  runId?: string;
  startedAt?: string;
  channels?: string[];
  lastExitReason?: string;
}

function writeStatus(info: StatusInfo): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  // Merge with existing status to preserve fields like lastExitReason
  let existing: Record<string, unknown> = {};
  try { existing = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8')); } catch { /* first write */ }
  const merged = { ...existing, ...info };
  const tmp = STATUS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), 'utf-8');
  fs.renameSync(tmp, STATUS_FILE);
}

async function main(): Promise<void> {
  // Load config.env into process.env for llm-provider.ts
  // This must happen before any code that reads process.env.ITI_*
  try {
    const content = fs.readFileSync(path.join(ITI_HOME, 'config.env'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if ((key.startsWith('ITI_') || key.startsWith('ANTHROPIC_') || key.startsWith('OPENAI_') || key.startsWith('CODEX_')) && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch { /* config.env may not exist yet */ }

  // Debug: verify env vars are loaded (before setupLogger)
  const debugEnv = {
    ITI_ENV_ISOLATION: process.env.ITI_ENV_ISOLATION || 'NOT SET',
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'NOT SET',
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN ? 'SET' : 'NOT SET',
  };
  
  const config = loadConfig();
  setupLogger();

  // Now log the debug info
  console.log('[iflow-to-im] Env check:', JSON.stringify(debugEnv));

  const runId = crypto.randomUUID();
  console.log(`[iflow-to-im] Starting bridge (run_id: ${runId})`);

  const settings = configToSettings(config);
  const store = new JsonFileStore(settings);
  const pendingPerms = new PendingPermissions();
  const llm = await resolveProvider(config, pendingPerms);
  console.log(`[iflow-to-im] Runtime: ${config.runtime}`);

  const gateway = {
    resolvePendingPermission: (id: string, resolution: { behavior: 'allow' | 'deny'; message?: string }) =>
      pendingPerms.resolve(id, resolution),
  };

  initBridgeContext({
    store,
    llm,
    permissions: gateway,
    lifecycle: {
      onBridgeStart: () => {
        // Write authoritative PID from the actual process (not shell $!)
        fs.mkdirSync(RUNTIME_DIR, { recursive: true });
        fs.writeFileSync(PID_FILE, String(process.pid), 'utf-8');
        writeStatus({
          running: true,
          pid: process.pid,
          runId,
          startedAt: new Date().toISOString(),
          channels: config.enabledChannels,
        });
        console.log(`[iflow-to-im] Bridge started (PID: ${process.pid}, channels: ${config.enabledChannels.join(', ')})`);
      },
      onBridgeStop: () => {
        writeStatus({ running: false });
        console.log('[iflow-to-im] Bridge stopped');
      },
    },
  });

  await bridgeManager.start();

  // Graceful shutdown
  let shuttingDown = false;
  const shutdown = async (signal?: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const reason = signal ? `signal: ${signal}` : 'shutdown requested';
    console.log(`[iflow-to-im] Shutting down (${reason})...`);
    pendingPerms.denyAll();
    await bridgeManager.stop();
    writeStatus({ running: false, lastExitReason: reason });
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));

  // ── Exit diagnostics ──
  process.on('unhandledRejection', (reason) => {
    console.error('[iflow-to-im] unhandledRejection:', reason instanceof Error ? reason.stack || reason.message : reason);
    writeStatus({ running: false, lastExitReason: `unhandledRejection: ${reason instanceof Error ? reason.message : String(reason)}` });
  });
  process.on('uncaughtException', (err) => {
    console.error('[iflow-to-im] uncaughtException:', err.stack || err.message);
    writeStatus({ running: false, lastExitReason: `uncaughtException: ${err.message}` });
    process.exit(1);
  });
  process.on('beforeExit', (code) => {
    console.log(`[iflow-to-im] beforeExit (code: ${code})`);
  });
  process.on('exit', (code) => {
    console.log(`[iflow-to-im] exit (code: ${code})`);
  });

  // ── Heartbeat to keep event loop alive ──
  // setInterval is ref'd by default, preventing Node from exiting
  // when the event loop would otherwise be empty.
  setInterval(() => { /* keepalive */ }, 45_000);
}

main().catch((err) => {
  console.error('[iflow-to-im] Fatal error:', err instanceof Error ? err.stack || err.message : err);
  try { writeStatus({ running: false, lastExitReason: `fatal: ${err instanceof Error ? err.message : String(err)}` }); } catch { /* ignore */ }
  process.exit(1);
});