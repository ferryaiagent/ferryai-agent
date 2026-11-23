---
name: ferryai
description: Generate images and video with FerryAI from Claude Code, Codex, opencode or the terminal. Use when a task needs a picture, a short video clip, image edits from reference photos, or text-to-video, and no local model or asset is available.
---

# FerryAI

Pay-per-call image and video generation. Eight models:

| model | does | price |
|---|---|---|
| `nano-banana-2` | text to image, image to image with up to 4 references | $0.03 per image |
| `nano-banana-pro` | premium text to image and image edit | $0.05 per image |
| `gpt-image-2.6` | text to image and image edit | $0.02 per image |
| `veo-3.1` | text to video, first/last frame, 3-image reference mode (8s) | $0.09 per second |
| `kling-4-0-flash` | fast text to video and image to video, 720p | $0.12 per second |
| `seedance-2-0-mini` | low cost text to video and image to video, 480p | $0.03 per second |
| `hailuo-2-3` | image to video from one start frame, 768p, fixed 6 seconds | $0.04 per second |
| `minimax-h3` | low cost text to video and image to video | $0.02 per second |

Failed jobs are never charged. Video that reaches 3 reference images renders at 8 seconds.
Uploads and generated files stay available for at least 7 days. Download anything the user needs to keep.

## Install

```bash
curl -fsSL https://ferryai.furrecast.com/skill/install.sh | sh
```

Installs this file to `~/.claude/skills/ferryai/SKILL.md` and `~/.agents/skills/ferryai/SKILL.md`.
Set `FERRYAI_API_KEY` to the key from https://ferryai.furrecast.com/keys.

## Get a key

1. Create an account at https://ferryai.furrecast.com (email code).
2. Add funds in Wallet, pay by card.
3. Create a key in API Keys. Any console key works for the API and bills your balance.

## Terminal

```bash
npx -y ferryai image "a red fox in deep snow" --out fox.png
npx -y ferryai image "same cat, night scene" --ref https://cdn.example/cat.png
npx -y ferryai video "drone shot over a fjord" --seconds 4 --wait --out fjord.mp4
npx -y ferryai balance
```

`FERRYAI_API_KEY` supplies the key. Useful flags: `--dry-run` (price only), `--json`.

## Claude Code

```bash
claude mcp add ferryai --env FERRYAI_API_KEY=sk-... -- npx -y ferryai-mcp
```

Then ask for what you want ("generate a 4 second clip of ...") and the agent calls
`generate_image`, `generate_video`, `get_video_task`, `account_balance`.

For a skill-only setup without MCP, this file can live in `~/.claude/skills/ferryai/SKILL.md`
and the agent will shell out to the CLI instead.

## Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.ferryai]
command = "npx"
args = ["-y", "ferryai-mcp"]
env = { FERRYAI_API_KEY = "sk-..." }
```

## opencode

`opencode.json` in the project root:

```json
{
  "mcp": {
    "ferryai": {
      "type": "local",
      "command": ["npx", "-y", "ferryai-mcp"],
      "enabled": true,
      "environment": { "FERRYAI_API_KEY": "sk-..." }
    }
  }
}
```

## Raw HTTP

```bash
curl https://ferryai.furrecast.com/v1/images \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"nano-banana-2","prompt":"a paper boat at dusk"}'
```

`POST /v1/images` is synchronous. `POST /v1/videos` returns `task_id`; poll `GET /v1/videos/{task_id}` until `COMPLETED` or `FAILED`.
