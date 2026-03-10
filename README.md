# iFlow-to-IM Skill

Bridge iFlow CLI / Codex to IM platforms — chat with AI coding agents from Telegram, Discord, Feishu/Lark, QQ, or WeCom (企业微信).

[中文文档](README_CN.md)

---

## How It Works

This skill runs a background daemon that connects your IM bots to iFlow CLI or Codex sessions. Messages from IM are forwarded to the AI coding agent, and responses (including tool use, permission requests, streaming previews) are sent back to your chat.

```
You (Telegram/Discord/Feishu/QQ/WeCom)
  ↕ Bot API
Background Daemon (Node.js)
  ↕ Agent SDK or Codex SDK (configurable via ITI_RUNTIME)
iFlow CLI / Codex → reads/writes your codebase
```

## Features

- **Five IM platforms** — Telegram, Discord, Feishu/Lark, QQ, WeCom (企业微信) — enable any combination
- **Interactive setup** — guided wizard collects tokens with step-by-step instructions
- **Permission control** — tool calls require explicit approval via inline buttons (Telegram/Discord) or text `/perm` commands (Feishu/QQ/WeCom)
- **Streaming preview** — see AI response as it types (Telegram & Discord)
- **Session persistence** — conversations survive daemon restarts
- **Secret protection** — tokens stored with `chmod 600`, auto-redacted in all logs
- **Zero code required** — install the skill and run `/iflow-to-im setup`, that's it

## Prerequisites

- **Node.js >= 20**
- **iFlow CLI** (for `ITI_RUNTIME=iflow` or `auto`) — installed and authenticated (`iflow` command available)
- **Codex CLI** (for `ITI_RUNTIME=codex` or `auto`) — `npm install -g @openai/codex`. Auth: run `codex auth login`, or set `OPENAI_API_KEY` (optional, for API mode)

## Installation

### npx skills (recommended)

```bash
npx skills add Feng-H/iflow-to-IM-skill
```

### Git clone

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/.iflow/skills/iflow-to-im
```

Clones the repo directly into your personal skills directory. iFlow CLI discovers it automatically.

### Symlink

If you prefer to keep the repo elsewhere (e.g., for development):

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/code/iflow-to-IM-skill
mkdir -p ~/.iflow/skills
ln -s ~/code/iflow-to-IM-skill ~/.iflow/skills/iflow-to-im
```

### Codex

If you use [Codex](https://github.com/openai/codex), clone directly into the Codex skills directory:

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/.codex/skills/iflow-to-im
```

Or use the provided install script for automatic dependency installation and build:

```bash
# Clone and install (copy mode)
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/code/iflow-to-IM-skill
bash ~/code/iflow-to-IM-skill/scripts/install-codex.sh

# Or use symlink mode for development
bash ~/code/iflow-to-IM-skill/scripts/install-codex.sh --link
```

### Verify installation

**iFlow CLI:** Start a new session and type `/` — you should see `iflow-to-im` in the skill list. Or ask the AI: "What skills are available?"

**Codex:** Start a new session and say "iflow-to-im setup" or "start bridge" — Codex will recognize the skill and run the setup wizard.

## Quick Start

### 1. Setup

```
/iflow-to-im setup
```

The wizard will guide you through:

1. **Choose channels** — pick Telegram, Discord, Feishu, QQ, WeCom, or any combination
2. **Enter credentials** — the wizard explains exactly where to get each token, which settings to enable, and what permissions to grant
3. **Set defaults** — working directory, model, and mode
4. **Validate** — tokens are verified against platform APIs immediately

### 2. Start

```
/iflow-to-im start
```

The daemon starts in the background. You can close the terminal — it keeps running.

### 3. Chat

Open your IM app and send a message to your bot. iFlow CLI will respond.

When the AI needs to use a tool (edit a file, run a command), you'll see a permission prompt with **Allow** / **Deny** buttons right in the chat (Telegram/Discord), or a text `/perm` command prompt (Feishu/QQ/WeCom).

## Commands

All commands are run inside iFlow CLI or Codex:

| iFlow CLI | Codex (natural language) | Description |
|---|---|---|
| `/iflow-to-im setup` | "iflow-to-im setup" / "配置" | Interactive setup wizard |
| `/iflow-to-im start` | "start bridge" / "启动桥接" | Start the bridge daemon |
| `/iflow-to-im stop` | "stop bridge" / "停止桥接" | Stop the bridge daemon |
| `/iflow-to-im status` | "bridge status" / "状态" | Show daemon status |
| `/iflow-to-im logs` | "查看日志" | Show last 50 log lines |
| `/iflow-to-im logs 200` | "logs 200" | Show last 200 log lines |
| `/iflow-to-im reconfigure` | "reconfigure" / "修改配置" | Update config interactively |
| `/iflow-to-im doctor` | "doctor" / "诊断" | Diagnose issues |

## Platform Setup Guides

The `setup` wizard provides inline guidance for every step. Here's a summary:

### Telegram

1. Message `@BotFather` on Telegram → `/newbot` → follow prompts
2. Copy the bot token (format: `123456789:AABbCc...`)
3. Recommended: `/setprivacy` → Disable (for group use)
4. Find your User ID: message `@userinfobot`

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot tab → Reset Token → copy it
3. Enable **Message Content Intent** under Privileged Gateway Intents
4. OAuth2 → URL Generator → scope `bot` → permissions: Send Messages, Read Message History, View Channels → copy invite URL

### Feishu / Lark

1. Go to [Feishu Open Platform](https://open.feishu.cn/app) (or [Lark](https://open.larksuite.com/app))
2. Create Custom App → get App ID and App Secret
3. **Batch-add permissions**: go to "Permissions & Scopes" → use batch configuration to add all required scopes (the `setup` wizard provides the exact JSON)
4. Enable Bot feature under "Add Features"
5. **Events & Callbacks**: select **"Long Connection"** as event dispatch method → add `im.message.receive_v1` event
6. **Publish**: go to "Version Management & Release" → create version → submit for review → approve in Admin Console
7. **Important**: The bot will NOT work until the version is approved and published

### QQ

> QQ currently supports **C2C private chat only**. No group/channel support, no inline permission buttons, no streaming preview. Permissions use text `/perm ...` commands. Image inbound only (no image replies).

1. Go to [QQ Bot OpenClaw](https://q.qq.com/qqbot/openclaw)
2. Create a QQ Bot or select an existing one → get **App ID** and **App Secret** (only two required fields)
3. Configure sandbox access and scan QR code with QQ to add the bot
4. `ITI_QQ_ALLOWED_USERS` takes `user_openid` values (not QQ numbers) — can be left empty initially
5. Set `ITI_QQ_IMAGE_ENABLED=false` if the underlying provider doesn't support image input

### WeCom (企业微信)

> WeCom supports both group bot webhook and enterprise application modes. The enterprise application mode enables full two-way conversations.

**Enterprise Application Mode (Recommended for two-way chat):**

1. Go to [WeCom Admin Console](https://work.weixin.qq.com/wework_admin/frame)
2. **Get Corp ID**: "My Company" → copy Corp ID
3. **Create Application**: "App Management" → "Create" → get Agent ID and Agent Secret
4. **Set Trusted IP** (optional): Add your server IP in application settings
5. **Configure Callback** (for receiving messages): 
   - "API Receive" → set URL and get Token, EncodingAESKey
   - Or use WebSocket/long-polling mode
6. `ITI_WECOM_ALLOWED_USERS` takes user IDs — can be left empty to allow all users

**Group Bot Webhook Mode (One-way notification only):**

1. In a WeCom group, click "Group Settings" → "Group Bots" → "Add Bot"
2. Copy the webhook URL (format: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`)
3. This mode can only send messages, cannot receive user messages

## Architecture

```
~/.iflow-to-im/
├── config.env             ← Credentials & settings (chmod 600)
├── data/                  ← Persistent JSON storage
│   ├── sessions.json
│   ├── bindings.json
│   ├── permissions.json
│   └── messages/          ← Per-session message history
├── logs/
│   └── bridge.log         ← Auto-rotated, secrets redacted
└── runtime/
    ├── bridge.pid          ← Daemon PID file
    └── status.json         ← Current status
```

### Key components

| Component | Role |
|---|---|
| `src/main.ts` | Daemon entry — assembles DI, starts bridge |
| `src/config.ts` | Load/save `config.env`, map to bridge settings |
| `src/store.ts` | JSON file BridgeStore (30 methods, write-through cache) |
| `src/llm-provider.ts` | Agent SDK `query()` → SSE stream |
| `src/codex-provider.ts` | Codex SDK `runStreamed()` → SSE stream |
| `src/sse-utils.ts` | Shared SSE formatting helper |
| `src/permission-gateway.ts` | Async bridge: SDK `canUseTool` ↔ IM buttons |
| `src/logger.ts` | Secret-redacted file logging with rotation |
| `scripts/daemon.sh` | Process management (start/stop/status/logs) |
| `scripts/doctor.sh` | Health checks |
| `SKILL.md` | iFlow CLI skill definition |

### Permission flow

```
1. AI wants to use a tool (e.g., Edit file)
2. SDK calls canUseTool() → LLMProvider emits permission_request SSE
3. Bridge sends inline buttons to IM chat: [Allow] [Deny]
4. canUseTool() blocks, waiting for user response (5 min timeout)
5. User taps Allow → bridge resolves the pending permission
6. SDK continues tool execution → result streamed back to IM
```

## Troubleshooting

Run diagnostics:

```
/iflow-to-im doctor
```

This checks: Node.js version, config file existence and permissions, token validity (live API calls), log directory, PID file consistency, and recent errors.

| Issue | Solution |
|---|---|
| `Bridge won't start` | Run `doctor`. Check if Node >= 20. Check logs. |
| `Messages not received` | Verify token with `doctor`. Check allowed users config. |
| `Permission timeout` | User didn't respond within 5 min. Tool call auto-denied. |
| `Stale PID file` | Run `stop` then `start`. daemon.sh auto-cleans stale PIDs. |

See [references/troubleshooting.md](references/troubleshooting.md) for more details.

## Security

- All credentials stored in `~/.iflow-to-im/config.env` with `chmod 600`
- Tokens are automatically redacted in all log output (pattern-based masking)
- Allowed user/channel/guild lists restrict who can interact with the bot
- The daemon is a local process with no inbound network listeners
- See [SECURITY.md](SECURITY.md) for threat model and incident response

## Development

```bash
npm install        # Install dependencies
npm run dev        # Run in dev mode
npm run typecheck  # Type check
npm test           # Run tests
npm run build      # Build bundle
```

## License

[MIT](LICENSE)