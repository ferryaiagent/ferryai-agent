# ferryai

Command line for FerryAI image and video generation.

```bash
npx -y ferryai image "a red fox in deep snow" --out fox.png
npx -y ferryai video "drone shot over a fjord" --seconds 4 --wait
FERRYAI_API_KEY=sk-... npx -y ferryai balance
```

Run `npx -y ferryai --help` for every flag.

- Agent setup: https://ferryai.furrecast.com/agents
- API keys: https://ferryai.furrecast.com/keys
- Source: https://github.com/ferryaiagent/ferryai-agent

Failed generations are never charged.
