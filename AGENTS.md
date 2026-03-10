# AGENTS.md - iFlow-to-IM Skill 项目上下文

## 项目概述

iFlow-to-IM 是一个 iFlow CLI Skill，用于将 iFlow CLI / Codex 会话桥接到即时通讯平台（Telegram、Discord、飞书/Lark、QQ、企业微信）。用户可以从移动端 IM 应用与 AI 编程助手交互，实现远程编程辅助。

## 技术栈

- **运行时**: Node.js >= 20
- **语言**: TypeScript (ESM 模块)
- **构建**: esbuild
- **核心 SDK**:
  - `@anthropic-ai/claude-agent-sdk` - Agent SDK
  - `@openai/codex-sdk` - Codex SDK（可选）
  - `claude-to-im` - 核心桥接库（GitHub: op7418/claude-to-im）

## 目录结构

```
~/.iflow-to-im/           # 用户数据目录
├── config.env            # 凭证与设置 (chmod 600)
├── data/                 # 持久化存储
│   ├── sessions.json
│   ├── bindings.json
│   ├── permissions.json
│   └── messages/
├── logs/                 # 日志
│   └── bridge.log
└── runtime/              # 运行时状态
    ├── bridge.pid
    └── status.json

项目目录/
├── src/
│   ├── main.ts              # 守护进程入口
│   ├── config.ts            # 配置加载/保存
│   ├── store.ts             # JSON 文件存储
│   ├── llm-provider.ts      # Agent SDK query() → SSE 流
│   ├── codex-provider.ts    # Codex SDK runStreamed() → SSE 流
│   ├── sse-utils.ts         # SSE 格式化工具
│   ├── permission-gateway.ts # 权限网关
│   └── logger.ts            # 日志模块
├── scripts/
│   ├── daemon.sh            # 进程管理
│   ├── doctor.sh            # 诊断脚本
│   ├── supervisor-*.sh      # 平台特定守护
│   └── install-codex.sh     # Codex 安装脚本
├── references/              # 参考文档
└── SKILL.md                 # iFlow CLI Skill 定义
```

## 构建与运行

```bash
# 开发
npm install           # 安装依赖
npm run dev           # 开发模式运行
npm run typecheck     # 类型检查

# 测试
npm test              # 运行所有测试

# 构建
npm run build         # 构建 dist/daemon.mjs
```

### 生产命令

在 iFlow CLI 中使用 skill 命令：

```
/iflow-to-im setup    # 交互式配置向导
/iflow-to-im start    # 启动桥接守护进程
/iflow-to-im stop     # 停止守护进程
/iflow-to-im status   # 查看运行状态
/iflow-to-im logs [N] # 查看日志（默认50行）
/iflow-to-im doctor   # 诊断问题
```

## 配置

配置文件位于 `~/.iflow-to-im/config.env`，关键字段：

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `ITI_RUNTIME` | 运行时后端：iflow / codex / auto | iflow |
| `ITI_ENABLED_CHANNELS` | 启用的渠道（逗号分隔）| - |
| `ITI_DEFAULT_WORKDIR` | 默认工作目录 | $CWD |
| `ITI_DEFAULT_MODE` | 默认模式：code / plan / ask | code |

### 平台配置

每个平台需要不同的凭证：

- **Telegram**: `ITI_TG_BOT_TOKEN`, `ITI_TG_CHAT_ID`, `ITI_TG_ALLOWED_USERS`
- **Discord**: `ITI_DISCORD_BOT_TOKEN`, `ITI_DISCORD_ALLOWED_USERS/CHANNELS/GUILDS`
- **Feishu**: `ITI_FEISHU_APP_ID`, `ITI_FEISHU_APP_SECRET`, `ITI_FEISHU_DOMAIN`
- **QQ**: `ITI_QQ_APP_ID`, `ITI_QQ_APP_SECRET`, `ITI_QQ_ALLOWED_USERS`
- **WeCom**: `ITI_WECOM_BOT_ID`, `ITI_WECOM_BOT_SECRET`, `ITI_WECOM_ALLOWED_USERS`

## 核心架构

### 运行时解析

```
ITI_RUNTIME=iflow   → 使用 Agent SDK (需要 iflow CLI)
ITI_RUNTIME=codex   → 使用 Codex SDK (需要 codex CLI)
ITI_RUNTIME=auto    → 优先 iflow，回退到 Codex
```

### 权限流程

1. AI 想要使用工具（如编辑文件）
2. SDK 调用 `canUseTool()` → LLMProvider 发出 `permission_request` SSE
3. 桥接发送内联按钮到 IM 聊天：[Allow] [Deny]
4. `canUseTool()` 阻塞，等待用户响应（5 分钟超时）
5. 用户点击 Allow → 桥接解决待处理权限
6. SDK 继续工具执行 → 结果流式返回到 IM

### 环境隔离

- `strict` 模式（默认）：仅白名单环境变量 + ITI_* 配置
- `inherit` 模式：完整父环境（移除 IFLOWCODE）

## 开发约定

### 代码风格

- TypeScript 严格模式
- ESM 模块（`.js` 导入后缀）
- 异步优先（async/await）

### 存储模式

- 原子写入：先写 `.tmp`，再 `rename`
- 写透缓存：内存 Map + JSON 文件持久化
- 所有敏感字段在日志中自动脱敏

### 安全实践

- 所有凭证存储在 `~/.iflow-to-im/config.env`，权限 600
- 日志自动脱敏（token/secret/password）
- 默认拒绝所有消息，需显式配置允许用户/频道

## 常见问题

### 守护进程无法启动

1. 运行 `/iflow-to-im doctor` 诊断
2. 检查 Node.js >= 20
3. 检查配置文件存在：`ls -la ~/.iflow-to-im/config.env`
4. 查看日志：`/iflow-to-im logs 100`

### 消息收不到

1. 验证令牌：`/iflow-to-im doctor`
2. 检查允许用户配置
3. 确认机器人已添加到群组/频道

### PID 文件过期

```bash
rm ~/.iflow-to-im/runtime/bridge.pid
/iflow-to-im start
```

## 相关文件

- [SKILL.md](SKILL.md) - iFlow CLI Skill 定义，包含命令解析逻辑
- [SECURITY.md](SECURITY.md) - 安全策略和事件响应
- [references/troubleshooting.md](references/troubleshooting.md) - 详细故障排查指南
- [references/setup-guides.md](references/setup-guides.md) - 各平台设置指南