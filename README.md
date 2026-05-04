# astro-inspect-clip

An [Astro](https://astro.build) dev-toolbar app that lets you **click any element** to inspect its source file, line number, and HTML — then **copy everything to clipboard** with an optional instruction.

Perfect for pasting into ChatGPT, Cursor, or any AI coding assistant.

![Astro Inspect & Clip](https://img.shields.io/badge/Astro-Dev%20Toolbar-BC52EE?logo=astro&logoColor=white)

## Features

- 🔍 **Inspect mode** — hover highlights, click captures element source info
- 📋 **One-click copy** — file path, line number, tag, classes, HTML snippet, and your custom instruction
- 🏷️ **Multi-select** — select multiple elements and copy them grouped by file
- 🔗 **Open in Editor** — jumps straight to the source line (supports VS Code, etc.)
- 🧩 **Astro-native** — integrates into the built-in dev toolbar, no separate UI
- 🚀 **Dev-only** — zero overhead in production, nothing ships to users

## Installation

```bash
npm install astro-inspect-clip
```

## Usage

Add the integration to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import astroInspectClip from 'astro-inspect-clip';

export default defineConfig({
  integrations: [astroInspectClip()],
});
```

Start your dev server:

```bash
npm run dev
```

Open the browser, click the **Inspect & Clip** icon in Astro's dev toolbar, and start clicking elements.

## How it works

1. A MutationObserver captures `data-astro-source-file` / `data-astro-source-loc` attributes before Astro's built-in Audit app removes them
2. When you click an element, the plugin resolves its source file and line
3. The panel shows file path, tag name, classes, and a truncated HTML snippet
4. Write an instruction (e.g. "Make this button primary") and hit **Copy**
5. Paste into your AI assistant — it gets the full context it needs

### Multi-select

Toggle **Multi** mode to select several elements. Hit **Done** when finished, write your instruction, and copy everything at once — grouped by file.

## Configuration

No configuration needed. The plugin only activates in `dev` mode.

## Requirements

- Astro 4.0+ / 5.0+ / 6.0+
- Node.js 18+

## License

[MIT](./LICENSE)
