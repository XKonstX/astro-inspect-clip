<div align="center">

# 🔍 astro-inspect-clip

**Click any element. Get the source. Copy it wherever you want.**

An [Astro](https://astro.build) dev toolbar app that turns your browser into a
source-aware inspector — grab file paths, line numbers, tag info, and HTML snippets
with a single click, then copy everything straight to your clipboard.

[![npm version](https://img.shields.io/npm/v/astro-inspect-clip?color=BC52EE&label=npm&logo=npm)](https://www.npmjs.com/package/astro-inspect-clip)
[![npm downloads](https://img.shields.io/npm/dm/astro-inspect-clip?color=BC52EE)](https://www.npmjs.com/package/astro-inspect-clip)
[![license](https://img.shields.io/npm/l/astro-inspect-clip?color=BC52EE)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-4%20%7C%205%20%7C%206-BC52EE?logo=astro&logoColor=white)](https://astro.build)

</div>

---

<!-- TODO: Replace with an actual screenshot or GIF
![astro-inspect-clip demo](https://github.com/XKonstX/astro-inspect-clip/raw/main/docs/demo.gif)
-->

## Why?

Ever clicked around your Astro site and wondered *"where does this component come from?"* —
then opened DevTools, searched the DOM tree, and still couldn't find the source file?

**astro-inspect-clip** fixes that. It hooks into Astro's built-in source annotations
(the ones Astro's own Audit toolbar removes) and keeps them alive, so you can:

- 🔎 **Inspect** — hover to highlight, click to capture source file + line number
- 📋 **Copy** — file path, element tag, classes, and HTML snippet land in your clipboard
- 📝 **Add instructions** — write what you want changed, then paste the whole thing anywhere
- ✨ **Open in Editor** — jump straight to the source line in VS Code (or your editor of choice)
- 🏷️ **Multi-select** — select several elements and copy them grouped by file

> **Dev-only.** Zero overhead in production. Nothing ships to your users.

---

## Install

```bash
npm install astro-inspect-clip
```

## Setup

Add the integration to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import astroInspectClip from 'astro-inspect-clip';

export default defineConfig({
  integrations: [
    astroInspectClip(),
  ],
});
```

That's it. Start your dev server:

```bash
npm run dev
```

Open the browser, click the **Inspect & Clip** icon in Astro's dev toolbar,
and start clicking elements.

---

## How it works

Astro adds `data-astro-source-file` and `data-astro-source-loc` attributes to every
element during development. The built-in Audit toolbar removes them — this plugin
captures them **before** they disappear using a MutationObserver cache.

When you click an element, the plugin:

1. Resolves the source file and line number (walks up the DOM if needed)
2. Shows a panel with file path, tag, classes, and HTML snippet
3. Lets you write an optional instruction
4. Copies everything to clipboard in a clean, structured format

### What gets copied

```
File: src/components/Header.astro:42
Element: <nav>
Classes: main-nav, sticky
HTML: <nav class="main-nav sticky">...</nav>

Instruction:
Make the nav collapse into a hamburger menu on mobile
```

### Multi-select

Toggle **Multi** mode to grab several elements at once. Hit **Done**, write your
instruction, and copy everything grouped by file — perfect for multi-component changes.

---

## Use cases

| Scenario | How it helps |
|---|---|
| **"Where is this component?"** | Click → see the exact file and line |
| **Working with an AI assistant** | Click → add instruction → paste into ChatGPT, Cursor, Copilot, etc. |
| **Code review** | Copy element source + context and drop it into a PR comment |
| **Debugging layout issues** | Inspect the exact HTML output with source location |
| **Onboarding** | New dev? Click around to learn the codebase structure |
| **Pair programming** | Share element context without screen sharing |

---

## Features at a glance

- 🔍 **Inspect mode** — hover highlights, click captures
- 📋 **One-click copy** — structured format ready to paste
- 🏷️ **Multi-select** — group multiple elements by file
- 🔗 **Open in Editor** — jump to source line in VS Code
- 🧩 **Astro-native** — lives inside the built-in dev toolbar
- 🚀 **Zero production cost** — only activates in dev mode
- 🎯 **Smart resolution** — walks up the DOM to find source info
- ⌨️ **Keyboard friendly** — press Escape to dismiss

---

## Requirements

- Astro **4.0+**, **5.0+**, or **6.0+**
- Node.js **18+**

## Configuration

No configuration needed. The plugin activates automatically when you run the dev server.

---

## Comparison with Astro's built-in Audit toolbar

| | Astro Audit | astro-inspect-clip |
|---|---|---|
| See source file & line | ✅ | ✅ |
| Copy element info | ❌ | ✅ |
| Add custom instructions | ❌ | ✅ |
| Multi-select | ❌ | ✅ |
| Open in Editor | ❌ | ✅ |
| Structured clipboard output | ❌ | ✅ |

Think of it as the Audit toolbar's more opinionated sibling — built for
developers who want to *do something* with what they inspect.

---

## License

[MIT](./LICENSE)

---

<div align="center">

**Made with ☕ for the Astro community**

[Report a bug](https://github.com/XKonstX/astro-inspect-clip/issues) ·
[Request a feature](https://github.com/XKonstX/astro-inspect-clip/issues) ·
[npm](https://www.npmjs.com/package/astro-inspect-clip)

</div>
