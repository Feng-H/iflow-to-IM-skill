# iFlow-to-IM Skill

将 iFlow CLI / Codex 桥接到 IM 平台 —— 在 Telegram、Discord、飞书、QQ 或企业微信中与 AI 编程代理对话。

[English](README.md)

---

## 工作原理

本 Skill 运行一个后台守护进程，将你的 IM 机器人连接到 iFlow CLI 或 Codex 会话。来自 IM 的消息被转发给 AI 编程代理，响应（包括工具调用、权限请求、流式预览）会发回到聊天中。

```
你（Telegram/Discord/飞书/QQ/企业微信）
  ↕ Bot API
后台守护进程（Node.js）
  ↕ Agent SDK 或 Codex SDK（通过 ITI_RUNTIME 配置）
iFlow CLI / Codex → 读写你的代码库
```

## 功能特性

- **五大 IM 平台** — Telegram、Discord、飞书/Lark、QQ、企业微信 — 可任意组合启用
- **交互式配置** — 引导式向导收集令牌，提供分步说明
- **权限控制** — 工具调用需通过内联按钮（Telegram/Discord）或文本 `/perm` 命令（飞书/QQ/企业微信）显式批准
- **流式预览** — 实时查看 AI 的输出（Telegram 和 Discord 支持）
- **会话持久化** — 对话在守护进程重启后保留
- **密钥保护** — 令牌以 `chmod 600` 存储，所有日志自动脱敏
- **零代码** — 安装 Skill 后运行 `/iflow-to-im setup` 即可

## 前置条件

- **Node.js >= 20**
- **iFlow CLI**（`ITI_RUNTIME=iflow` 或 `auto` 时需要）— 已安装并完成认证（`iflow` 命令可用）
- **Codex CLI**（`ITI_RUNTIME=codex` 或 `auto` 时需要）— `npm install -g @openai/codex`。认证：运行 `codex auth login`，或设置 `OPENAI_API_KEY`（可选，用于 API 模式）

## 安装

### npx skills（推荐）

```bash
npx skills add Feng-H/iflow-to-IM-skill
```

### Git 克隆

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/.iflow/skills/iflow-to-im
```

将仓库直接克隆到个人 Skills 目录，iFlow CLI 会自动发现。

### 符号链接

如果你想把仓库放在其他位置（如用于开发）：

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/code/iflow-to-IM-skill
mkdir -p ~/.iflow/skills
ln -s ~/code/iflow-to-IM-skill ~/.iflow/skills/iflow-to-im
```

### Codex

如果你使用 [Codex](https://github.com/openai/codex)，直接克隆到 Codex 的 Skills 目录：

```bash
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/.codex/skills/iflow-to-im
```

或使用提供的安装脚本自动安装依赖并构建：

```bash
# 克隆并安装（复制模式）
git clone https://github.com/Feng-H/iflow-to-IM-skill.git ~/code/iflow-to-IM-skill
bash ~/code/iflow-to-IM-skill/scripts/install-codex.sh

# 或使用符号链接模式（开发用）
bash ~/code/iflow-to-IM-skill/scripts/install-codex.sh --link
```

### 验证安装

**iFlow CLI：** 启动新会话，输入 `/` 应能看到 `iflow-to-im`。也可以问 AI："有什么可用的 Skills？"

**Codex：** 启动新会话，说 "iflow-to-im setup" 或 "启动桥接"，Codex 会识别 Skill 并运行配置向导。

## 快速开始

### 1. 配置

```
/iflow-to-im setup
```

向导将引导你完成：

1. **选择渠道** — 选择 Telegram、Discord、飞书、QQ、企业微信，或任意组合
2. **输入凭证** — 向导会详细说明每个令牌的获取位置、需要启用的设置和权限
3. **设置默认值** — 工作目录、模型和模式
4. **验证** — 令牌会立即通过平台 API 验证

### 2. 启动

```
/iflow-to-im start
```

守护进程在后台启动。你可以关闭终端 —— 它会持续运行。

### 3. 对话

打开 IM 应用，给你的机器人发消息，iFlow CLI 会回复。

当 AI 需要使用工具（编辑文件、运行命令）时，聊天中会弹出带有 **允许** / **拒绝** 按钮的权限请求（Telegram/Discord），或文本 `/perm` 命令提示（飞书/QQ/企业微信）。

## 命令

所有命令在 iFlow CLI 或 Codex 中执行：

| iFlow CLI | Codex（自然语言） | 说明 |
|---|---|---|
| `/iflow-to-im setup` | "iflow-to-im setup" / "配置" | 交互式配置向导 |
| `/iflow-to-im start` | "start bridge" / "启动桥接" | 启动桥接守护进程 |
| `/iflow-to-im stop` | "stop bridge" / "停止桥接" | 停止守护进程 |
| `/iflow-to-im status` | "bridge status" / "状态" | 查看运行状态 |
| `/iflow-to-im logs` | "查看日志" | 查看最近 50 行日志 |
| `/iflow-to-im logs 200` | "logs 200" | 查看最近 200 行日志 |
| `/iflow-to-im reconfigure` | "reconfigure" / "修改配置" | 交互式修改配置 |
| `/iflow-to-im doctor` | "doctor" / "诊断" | 诊断问题 |

## 平台配置指南

`setup` 向导为每一步提供内联指导。以下是摘要：

### Telegram

1. 在 Telegram 上私信 `@BotFather` → `/newbot` → 按提示操作
2. 复制机器人令牌（格式：`123456789:AABbCc...`）
3. 推荐：`/setprivacy` → Disable（用于群组）
4. 获取你的用户 ID：私信 `@userinfobot`

### Discord

1. 前往 [Discord 开发者门户](https://discord.com/developers/applications) → New Application
2. Bot 标签页 → Reset Token → 复制
3. 在 Privileged Gateway Intents 下启用 **Message Content Intent**
4. OAuth2 → URL Generator → scope 选 `bot` → 权限：Send Messages, Read Message History, View Channels → 复制邀请链接

### 飞书 / Lark

1. 前往[飞书开放平台](https://open.feishu.cn/app)（或 [Lark](https://open.larksuite.com/app)）
2. 创建企业自建应用 → 获取 App ID 和 App Secret
3. **批量添加权限**：进入"权限与审批" → 使用批量配置添加所有必要权限（`setup` 向导提供具体 JSON）
4. 在"添加应用能力"下启用机器人功能
5. **事件订阅**：选择 **"长连接"** 作为事件接收方式 → 添加 `im.message.receive_v1` 事件
6. **发布**：进入"版本管理与发布" → 创建版本 → 提交审核 → 在管理后台审批
7. **重要**：机器人只有在版本审批通过并发布后才能正常工作

### QQ

> QQ 目前仅支持 **C2C 私聊**。不支持群/频道，无内联权限按钮，无流式预览。权限使用文本 `/perm ...` 命令。仅支持图片入站（无图片回复）。

1. 前往 [QQ 机器人开放平台](https://q.qq.com/qqbot/openclaw)
2. 创建 QQ 机器人或选择已有机器人 → 获取 **App ID** 和 **App Secret**（仅需这两个字段）
3. 配置沙盒访问，用 QQ 扫码添加机器人
4. `ITI_QQ_ALLOWED_USERS` 接受 `user_openid` 值（非 QQ 号）—— 初始可留空
5. 如果底层提供商不支持图片输入，设置 `ITI_QQ_IMAGE_ENABLED=false`

### 企业微信

> 企业微信支持群机器人 Webhook 和企业应用两种模式。企业应用模式可实现完整的双向对话。

**企业应用模式（推荐，支持双向对话）：**

1. 前往[企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)
2. **获取企业 ID**：「我的企业」→ 复制企业 ID
3. **创建应用**：「应用管理」→「创建」→ 获取 AgentId 和 Secret
4. **设置可信 IP**（可选）：在应用设置中添加服务器 IP
5. **配置回调**（用于接收消息）：
   - 「API 接收」→ 设置 URL 并获取 Token、EncodingAESKey
   - 或使用 WebSocket/长轮询模式
6. `ITI_WECOM_ALLOWED_USERS` 接受用户 ID —— 可留空允许所有用户

**群机器人 Webhook 模式（仅单向通知）：**

1. 在企业微信群中，点击「群设置」→「群机器人」→「添加机器人」
2. 复制 Webhook 地址（格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`）
3. 此模式只能发送消息，无法接收用户消息

## 架构

```
~/.iflow-to-im/
├── config.env             ← 凭证与设置（chmod 600）
├── data/                  ← 持久化 JSON 存储
│   ├── sessions.json
│   ├── bindings.json
│   ├── permissions.json
│   └── messages/          ← 每会话消息历史
├── logs/
│   └── bridge.log         ← 自动轮转，密钥脱敏
└── runtime/
    ├── bridge.pid          ← 守护进程 PID 文件
    └── status.json         ← 当前状态
```

### 核心组件

| 组件 | 作用 |
|---|---|
| `src/main.ts` | 守护进程入口 — 组装 DI，启动桥接 |
| `src/config.ts` | 加载/保存 `config.env`，映射到桥接设置 |
| `src/store.ts` | JSON 文件 BridgeStore（30 个方法，写透缓存）|
| `src/llm-provider.ts` | Agent SDK `query()` → SSE 流 |
| `src/codex-provider.ts` | Codex SDK `runStreamed()` → SSE 流 |
| `src/sse-utils.ts` | 共享 SSE 格式化工具 |
| `src/permission-gateway.ts` | 异步桥接：SDK `canUseTool` ↔ IM 按钮 |
| `src/logger.ts` | 密钥脱敏的文件日志，支持轮转 |
| `scripts/daemon.sh` | 进程管理（start/stop/status/logs）|
| `scripts/doctor.sh` | 健康检查 |
| `SKILL.md` | iFlow CLI Skill 定义 |

### 权限流程

```
1. AI 想要使用工具（如编辑文件）
2. SDK 调用 canUseTool() → LLMProvider 发出 permission_request SSE
3. 桥接发送内联按钮到 IM 聊天：[允许] [拒绝]
4. canUseTool() 阻塞，等待用户响应（5 分钟超时）
5. 用户点击允许 → 桥接解决待处理权限
6. SDK 继续工具执行 → 结果流式返回到 IM
```

## 故障排查

运行诊断：

```
/iflow-to-im doctor
```

这会检查：Node.js 版本、配置文件存在性和权限、令牌有效性（实时 API 调用）、日志目录、PID 文件一致性、最近错误。

| 问题 | 解决方案 |
|---|---|
| `守护进程无法启动` | 运行 `doctor`。检查 Node >= 20。查看日志。|
| `收不到消息` | 用 `doctor` 验证令牌。检查允许用户配置。|
| `权限超时` | 用户未在 5 分钟内响应。工具调用自动拒绝。|
| `过期 PID 文件` | 运行 `stop` 然后 `start`。daemon.sh 自动清理过期 PID。|

详见 [references/troubleshooting.md](references/troubleshooting.md)。

## 安全

- 所有凭证存储在 `~/.iflow-to-im/config.env`，权限 `chmod 600`
- 所有日志输出自动脱敏令牌（基于模式匹配）
- 允许用户/频道/服务器列表限制谁可以与机器人交互
- 守护进程是本地进程，无入站网络监听器
- 参见 [SECURITY.md](SECURITY.md) 了解威胁模型和事件响应

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式运行
npm run typecheck  # 类型检查
npm test           # 运行测试
npm run build      # 构建产物
```

## 许可证

[MIT](LICENSE)