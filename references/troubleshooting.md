# Troubleshooting

## Bridge won't start

**Symptoms**: `/iflow-to-im start` fails or daemon exits immediately.

**Steps**:

1. Run `/iflow-to-im doctor` to identify the issue
2. Check that Node.js >= 20 is installed: `node --version`
3. Check that iFlow CLI is available: `iflow --version`
4. Verify config exists: `ls -la ~/.iflow-to-im/config.env`
5. Check logs for startup errors: `/iflow-to-im logs`

**Common causes**:
- Missing or invalid config.env -- run `/iflow-to-im setup`
- Node.js not found or wrong version -- install Node.js >= 20
- Port or resource conflict -- check if another instance is running with `/iflow-to-im status`

## Messages not received

**Symptoms**: Bot is online but doesn't respond to messages.

**Steps**:

1. Verify the bot token is valid: `/iflow-to-im doctor`
2. Check allowed user IDs in config -- if set, only listed users can interact
3. For Telegram: ensure you've sent `/start` to the bot first
4. For Discord: verify the bot has been invited to the server with message read permissions
5. For Feishu: confirm the app has been approved and event subscriptions are configured
6. For WeCom: confirm the application is published and callback URL is accessible
7. Check logs for incoming message events: `/iflow-to-im logs 200`

## Permission timeout

**Symptoms**: AI session starts but times out waiting for tool approval.

**Steps**:

1. The bridge runs the AI in non-interactive mode; ensure your configuration allows the necessary tools
2. Consider using `--allowedTools` in your configuration to pre-approve common tools
3. Check network connectivity if the timeout occurs during API calls

## High memory usage

**Symptoms**: The daemon process consumes increasing memory over time.

**Steps**:

1. Check current memory usage: `/iflow-to-im status`
2. Restart the daemon to reset memory:
   ```
   /iflow-to-im stop
   /iflow-to-im start
   ```
3. If the issue persists, check how many concurrent sessions are active -- each session consumes memory
4. Review logs for error loops that may cause memory leaks

## Stale PID file

**Symptoms**: Status shows "running" but the process doesn't exist, or start refuses because it thinks a daemon is already running.

The daemon management script (`daemon.sh`) handles stale PID files automatically. If you still encounter issues:

1. Run `/iflow-to-im stop` -- it will clean up the stale PID file
2. If stop also fails, manually remove the PID file:
   ```bash
   rm ~/.iflow-to-im/runtime/bridge.pid
   ```
3. Run `/iflow-to-im start` to launch a fresh instance

## WeCom (企业微信) issues

**Symptoms**: WeCom bot not responding or token validation fails.

**Steps**:

1. Verify corp ID, agent ID, and secret are correct
2. Check if the application is published (not in draft mode)
3. For callback mode, verify the callback URL is accessible from WeCom servers
4. Check if the user is in the allowed users list
5. Verify your server IP is in the trusted IP list (if configured)

## QQ issues

**Symptoms**: QQ bot not responding.

**Steps**:

1. Verify App ID and App Secret from https://q.qq.com/qqbot/openclaw
2. Check if the sandbox is enabled and user has added the bot
3. QQ only supports C2C private chat -- group messages are not supported
4. Verify user's `openid` is in the allowed users list (not QQ number)