# FerryAI Agent

Generate images and short videos from Claude Code, Codex, Cursor, Gemini CLI,
Windsurf, opencode, or a terminal with one FerryAI API key.

## MCP server

```bash
claude mcp add ferryai --env FERRYAI_API_KEY=sk-... -- npx -y ferryai-mcp
```

The server exposes:

- `generate_image`
- `generate_video`
- `get_video_task`
- `account_balance`

Official MCP Registry name:

```text
io.github.ferryaiagent/ferryai
```

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.ferryai]
command = "npx"
args = ["-y", "ferryai-mcp"]
env = { FERRYAI_API_KEY = "sk-..." }
```

### Cursor

Add this to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ferryai": {
      "command": "npx",
      "args": ["-y", "ferryai-mcp"],
      "env": {
        "FERRYAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## CLI

```bash
npx -y ferryai image "a red fox in deep snow" --out fox.png
npx -y ferryai video "drone shot over a fjord" --seconds 4 --wait --out fjord.mp4
FERRYAI_API_KEY=sk-... npx -y ferryai balance
```

## Claude Code plugin

The plugin in `plugins/ferryai` combines the FerryAI skill with the local MCP
server and prompts for the API key when enabled.

```bash
claude plugin marketplace add ferryaiagent/ferryai-agent
claude plugin install ferryai@ferryai-agent
```

## Links

- Product and API keys: https://ferryai.furrecast.com
- Agent setup: https://ferryai.furrecast.com/agents
- API documentation: https://ferryai.furrecast.com/docs

Failed generations are never charged. This repository contains no credentials
or application source code.

