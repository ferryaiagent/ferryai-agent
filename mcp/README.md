# ferryai-mcp

MCP server for FerryAI image and video generation. It runs on your machine over
stdio and calls the FerryAI API with your key.

```bash
claude mcp add ferryai --env FERRYAI_API_KEY=sk-... -- npx -y ferryai-mcp
```

Tools: `generate_image`, `generate_video`, `get_video_task`, `account_balance`.

Official MCP Registry name: `io.github.ferryaiagent/ferryai`

- Agent setup: https://ferryai.furrecast.com/agents
- API keys: https://ferryai.furrecast.com/keys
- Source: https://github.com/ferryaiagent/ferryai-agent

Failed generations are never charged.
