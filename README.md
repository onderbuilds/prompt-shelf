# prompt-shelf

Chrome extension for saving and reusing prompts on ChatGPT, Claude, Gemini and Grok. Everything is stored locally in the browser.

- one-click insert from a floating button (falls back to clipboard)
- templates with `{{variable|default}}` placeholders
- folders, tags, search
- JSON import/export with automatic backup
- prompt packs, version history, sync between devices
- English and Turkish UI

## Load it

1. Open `chrome://extensions` and turn on Developer mode
2. Load unpacked → select the `prompt-manager` folder

## Development

```sh
npm install
npm run test:unit
npm run build:mocks && npm run test:e2e
```

Prompt packs are generated from `tools/` with `python3 tools/build_packs.py`.
