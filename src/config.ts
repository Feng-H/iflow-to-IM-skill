import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface Config {
  runtime: 'iflow' | 'codex' | 'auto';
  enabledChannels: string[];
  defaultWorkDir: string;
  defaultModel?: string;
  defaultMode: string;
  // Telegram
  tgBotToken?: string;
  tgChatId?: string;
  tgAllowedUsers?: string[];
  // Feishu
  feishuAppId?: string;
  feishuAppSecret?: string;
  feishuDomain?: string;
  feishuAllowedUsers?: string[];
  // Discord
  discordBotToken?: string;
  discordAllowedUsers?: string[];
  discordAllowedChannels?: string[];
  discordAllowedGuilds?: string[];
  // QQ
  qqAppId?: string;
  qqAppSecret?: string;
  qqAllowedUsers?: string[];
  qqImageEnabled?: boolean;
  qqMaxImageSize?: number;
  // WeCom (企业微信) - 智能机器人长连接配置
  wecomBotId?: string;
  wecomSecret?: string;
  wecomAllowedUsers?: string[];
  // Auto-approve all tool permission requests without user confirmation
  autoApprove?: boolean;
}

export const ITI_HOME = process.env.ITI_HOME || path.join(os.homedir(), ".iflow-to-im");
export const CONFIG_PATH = path.join(ITI_HOME, "config.env");

function parseEnvFile(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.set(key, value);
  }
  return entries;
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadConfig(): Config {
  let env = new Map<string, string>();
  try {
    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    env = parseEnvFile(content);
  } catch {
    // Config file doesn't exist yet — use defaults
  }

  const rawRuntime = env.get("ITI_RUNTIME") || "iflow";
  const runtime = (["iflow", "codex", "auto"].includes(rawRuntime) ? rawRuntime : "iflow") as Config["runtime"];

  return {
    runtime,
    enabledChannels: splitCsv(env.get("ITI_ENABLED_CHANNELS")) ?? [],
    defaultWorkDir: env.get("ITI_DEFAULT_WORKDIR") || process.cwd(),
    defaultModel: env.get("ITI_DEFAULT_MODEL") || undefined,
    defaultMode: env.get("ITI_DEFAULT_MODE") || "code",
    tgBotToken: env.get("ITI_TG_BOT_TOKEN") || undefined,
    tgChatId: env.get("ITI_TG_CHAT_ID") || undefined,
    tgAllowedUsers: splitCsv(env.get("ITI_TG_ALLOWED_USERS")),
    feishuAppId: env.get("ITI_FEISHU_APP_ID") || undefined,
    feishuAppSecret: env.get("ITI_FEISHU_APP_SECRET") || undefined,
    feishuDomain: env.get("ITI_FEISHU_DOMAIN") || undefined,
    feishuAllowedUsers: splitCsv(env.get("ITI_FEISHU_ALLOWED_USERS")),
    discordBotToken: env.get("ITI_DISCORD_BOT_TOKEN") || undefined,
    discordAllowedUsers: splitCsv(env.get("ITI_DISCORD_ALLOWED_USERS")),
    discordAllowedChannels: splitCsv(
      env.get("ITI_DISCORD_ALLOWED_CHANNELS")
    ),
    discordAllowedGuilds: splitCsv(env.get("ITI_DISCORD_ALLOWED_GUILDS")),
    qqAppId: env.get("ITI_QQ_APP_ID") || undefined,
    qqAppSecret: env.get("ITI_QQ_APP_SECRET") || undefined,
    qqAllowedUsers: splitCsv(env.get("ITI_QQ_ALLOWED_USERS")),
    qqImageEnabled: env.has("ITI_QQ_IMAGE_ENABLED")
      ? env.get("ITI_QQ_IMAGE_ENABLED") === "true"
      : undefined,
    qqMaxImageSize: env.get("ITI_QQ_MAX_IMAGE_SIZE")
      ? Number(env.get("ITI_QQ_MAX_IMAGE_SIZE"))
      : undefined,
    // WeCom (企业微信) - 长连接模式
    wecomBotId: env.get("ITI_WECOM_BOT_ID") || undefined,
    wecomSecret: env.get("ITI_WECOM_SECRET") || undefined,
    wecomAllowedUsers: splitCsv(env.get("ITI_WECOM_ALLOWED_USERS")),
    autoApprove: env.get("ITI_AUTO_APPROVE") === "true",
  };
}

function formatEnvLine(key: string, value: string | undefined): string {
  if (value === undefined || value === "") return "";
  return `${key}=${value}\n`;
}

export function saveConfig(config: Config): void {
  let out = "";
  out += formatEnvLine("ITI_RUNTIME", config.runtime);
  out += formatEnvLine(
    "ITI_ENABLED_CHANNELS",
    config.enabledChannels.join(",")
  );
  out += formatEnvLine("ITI_DEFAULT_WORKDIR", config.defaultWorkDir);
  if (config.defaultModel) out += formatEnvLine("ITI_DEFAULT_MODEL", config.defaultModel);
  out += formatEnvLine("ITI_DEFAULT_MODE", config.defaultMode);
  out += formatEnvLine("ITI_TG_BOT_TOKEN", config.tgBotToken);
  out += formatEnvLine("ITI_TG_CHAT_ID", config.tgChatId);
  out += formatEnvLine(
    "ITI_TG_ALLOWED_USERS",
    config.tgAllowedUsers?.join(",")
  );
  out += formatEnvLine("ITI_FEISHU_APP_ID", config.feishuAppId);
  out += formatEnvLine("ITI_FEISHU_APP_SECRET", config.feishuAppSecret);
  out += formatEnvLine("ITI_FEISHU_DOMAIN", config.feishuDomain);
  out += formatEnvLine(
    "ITI_FEISHU_ALLOWED_USERS",
    config.feishuAllowedUsers?.join(",")
  );
  out += formatEnvLine("ITI_DISCORD_BOT_TOKEN", config.discordBotToken);
  out += formatEnvLine(
    "ITI_DISCORD_ALLOWED_USERS",
    config.discordAllowedUsers?.join(",")
  );
  out += formatEnvLine(
    "ITI_DISCORD_ALLOWED_CHANNELS",
    config.discordAllowedChannels?.join(",")
  );
  out += formatEnvLine(
    "ITI_DISCORD_ALLOWED_GUILDS",
    config.discordAllowedGuilds?.join(",")
  );
  out += formatEnvLine("ITI_QQ_APP_ID", config.qqAppId);
  out += formatEnvLine("ITI_QQ_APP_SECRET", config.qqAppSecret);
  out += formatEnvLine(
    "ITI_QQ_ALLOWED_USERS",
    config.qqAllowedUsers?.join(",")
  );
  if (config.qqImageEnabled !== undefined)
    out += formatEnvLine("ITI_QQ_IMAGE_ENABLED", String(config.qqImageEnabled));
  if (config.qqMaxImageSize !== undefined)
    out += formatEnvLine("ITI_QQ_MAX_IMAGE_SIZE", String(config.qqMaxImageSize));

  // WeCom (企业微信) - 长连接模式
  out += formatEnvLine("ITI_WECOM_BOT_ID", config.wecomBotId);
  out += formatEnvLine("ITI_WECOM_SECRET", config.wecomSecret);
  out += formatEnvLine(
    "ITI_WECOM_ALLOWED_USERS",
    config.wecomAllowedUsers?.join(",")
  );

  fs.mkdirSync(ITI_HOME, { recursive: true });
  const tmpPath = CONFIG_PATH + ".tmp";
  fs.writeFileSync(tmpPath, out, { mode: 0o600 });
  fs.renameSync(tmpPath, CONFIG_PATH);
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return "*".repeat(value.length - 4) + value.slice(-4);
}

export function configToSettings(config: Config): Map<string, string> {
  const m = new Map<string, string>();
  m.set("remote_bridge_enabled", "true");

  // ── Telegram ──
  // Upstream keys: telegram_bot_token, bridge_telegram_enabled,
  //   telegram_bridge_allowed_users, telegram_chat_id
  m.set(
    "bridge_telegram_enabled",
    config.enabledChannels.includes("telegram") ? "true" : "false"
  );
  if (config.tgBotToken) m.set("telegram_bot_token", config.tgBotToken);
  if (config.tgAllowedUsers)
    m.set("telegram_bridge_allowed_users", config.tgAllowedUsers.join(","));
  if (config.tgChatId) m.set("telegram_chat_id", config.tgChatId);

  // ── Discord ──
  // Upstream keys: bridge_discord_bot_token, bridge_discord_enabled,
  //   bridge_discord_allowed_users, bridge_discord_allowed_channels,
  //   bridge_discord_allowed_guilds
  m.set(
    "bridge_discord_enabled",
    config.enabledChannels.includes("discord") ? "true" : "false"
  );
  if (config.discordBotToken)
    m.set("bridge_discord_bot_token", config.discordBotToken);
  if (config.discordAllowedUsers)
    m.set("bridge_discord_allowed_users", config.discordAllowedUsers.join(","));
  if (config.discordAllowedChannels)
    m.set(
      "bridge_discord_allowed_channels",
      config.discordAllowedChannels.join(",")
    );
  if (config.discordAllowedGuilds)
    m.set(
      "bridge_discord_allowed_guilds",
      config.discordAllowedGuilds.join(",")
    );

  // ── Feishu ──
  // Upstream keys: bridge_feishu_app_id, bridge_feishu_app_secret,
  //   bridge_feishu_domain, bridge_feishu_enabled, bridge_feishu_allowed_users
  m.set(
    "bridge_feishu_enabled",
    config.enabledChannels.includes("feishu") ? "true" : "false"
  );
  if (config.feishuAppId) m.set("bridge_feishu_app_id", config.feishuAppId);
  if (config.feishuAppSecret)
    m.set("bridge_feishu_app_secret", config.feishuAppSecret);
  if (config.feishuDomain) m.set("bridge_feishu_domain", config.feishuDomain);
  if (config.feishuAllowedUsers)
    m.set("bridge_feishu_allowed_users", config.feishuAllowedUsers.join(","));

  // ── QQ ──
  // Upstream keys: bridge_qq_enabled, bridge_qq_app_id, bridge_qq_app_secret,
  //   bridge_qq_allowed_users, bridge_qq_image_enabled, bridge_qq_max_image_size
  m.set(
    "bridge_qq_enabled",
    config.enabledChannels.includes("qq") ? "true" : "false"
  );
  if (config.qqAppId) m.set("bridge_qq_app_id", config.qqAppId);
  if (config.qqAppSecret) m.set("bridge_qq_app_secret", config.qqAppSecret);
  if (config.qqAllowedUsers)
    m.set("bridge_qq_allowed_users", config.qqAllowedUsers.join(","));
  if (config.qqImageEnabled !== undefined)
    m.set("bridge_qq_image_enabled", String(config.qqImageEnabled));
  if (config.qqMaxImageSize !== undefined)
    m.set("bridge_qq_max_image_size", String(config.qqMaxImageSize));

  // ── WeCom (企业微信) - 长连接模式 ──
  // Upstream keys: bridge_wecom_enabled, bridge_wecom_bot_id, bridge_wecom_secret,
  //   bridge_wecom_allowed_users
  m.set(
    "bridge_wecom_enabled",
    config.enabledChannels.includes("wecom") ? "true" : "false"
  );
  if (config.wecomBotId) m.set("bridge_wecom_bot_id", config.wecomBotId);
  if (config.wecomSecret) m.set("bridge_wecom_secret", config.wecomSecret);
  if (config.wecomAllowedUsers)
    m.set("bridge_wecom_allowed_users", config.wecomAllowedUsers.join(","));

  // ── Defaults ──
  // Upstream keys: bridge_default_work_dir, bridge_default_model, default_model
  m.set("bridge_default_work_dir", config.defaultWorkDir);
  if (config.defaultModel) {
    m.set("bridge_default_model", config.defaultModel);
    m.set("default_model", config.defaultModel);
  }
  m.set("bridge_default_mode", config.defaultMode);

  return m;
}