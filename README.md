<div align="center">

# astro-inspect-clip

**Inspect Astro-rendered UI, collect source and DOM context, and copy focused instructions.**

An Astro dev toolbar app for teams that use the browser as the fastest way to
point at UI work. Click an element, resolve its source file and line, capture
nearby route, heading, text, and data-attribute context, add an instruction, and
copy a clean context block for your editor, assistant, review, or issue tracker.

[![npm version](https://img.shields.io/npm/v/astro-inspect-clip?color=BC52EE&label=npm&logo=npm)](https://www.npmjs.com/package/astro-inspect-clip)
[![npm downloads](https://img.shields.io/npm/dm/astro-inspect-clip?color=BC52EE)](https://www.npmjs.com/package/astro-inspect-clip)
[![license](https://img.shields.io/npm/l/astro-inspect-clip?color=BC52EE)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-4%20%7C%205%20%7C%206-BC52EE?logo=astro&logoColor=white)](https://astro.build)

</div>

---

## Install

```bash
npm install astro-inspect-clip
```

Add the integration to `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import astroInspectClip from 'astro-inspect-clip';

export default defineConfig({
  integrations: [
    astroInspectClip(),
  ],
});
```

Start Astro in development mode and open the Astro dev toolbar.

```bash
npm run dev
```

`astro-inspect-clip` is dev-only. It injects the toolbar app and source-cache
script only for the development server; nothing is added to production output.

## Version Lines

Version 2 is the active line.

```bash
npm install astro-inspect-clip@2
```

Version 1 remains installable for projects that want the older behavior.

```bash
npm install astro-inspect-clip@1
```

Publishing `2.0.0` does not remove old npm versions. npm keeps historical
versions immutable, so projects can pin `astro-inspect-clip@1.x` while new
projects can use `@2`.

## What's New In 2.0

- DOM-aware copied context that includes route, page title, nearby heading or
  labelled region, element text, relevant `data-*` attributes, and a compact DOM
  path so reused components can be understood in their page context.
- Review mode for collecting multiple commented UI contexts without keeping the
  toolbar panel open.
- Floating review controls with start/stop, clear, and complete-context copy.
- Per-element comment popover for saving instructions directly on inspected UI.
- Commented element highlighting that survives toolbar open/close and page swaps.
- Instance-aware matching for repeated Astro components rendered from the same
  source line.
- Cleaner fallback diagnostics when runtime DOM has no Astro source metadata.
- Internal module split for source cache, storage, copy text, DOM utilities,
  styles, and clipboard behavior.
- Local demo app for validating nested components, repeated cards, grouped
  selection, and runtime-only markup.

## Common Workflows

### Single Element

1. Open the Astro dev toolbar.
2. Start Inspect & Clip.
3. Click an element in the page.
4. Add an instruction.
5. Copy the generated context.

Example output:

```text
File: src/components/Header.astro:42:5
Element: <nav>
Classes: site-nav, is-sticky
HTML: <nav class="site-nav is-sticky">...</nav>
Context:
Route: /docs
Page title: Documentation
Nearest heading: Product Docs
Text: Docs
DOM path: body > header.site-header > nav.site-nav
Instruction:
Make the navigation collapse below 768px.
```

### Review Context

Use review mode when you want to collect several targeted comments before
copying everything at once.

1. Start Inspect & Clip from the dev toolbar.
2. Click an element.
3. Write a note in the floating comment popover.
4. Repeat for other elements.
5. Use **Copy context** from the floating review bar.

The copied output groups every saved comment into one structured block.

### Multi-Select

Enable **Multi** mode when one instruction applies to several elements.
Selected elements are copied together and grouped by source file where useful.

## Demo

This repository includes a local Astro demo site.

```bash
npm run demo
```

The demo builds the toolbar app, starts the Astro dev server, and loads the
local integration from `dist`. Use it to check:

- repeated component cards with the same Astro source line,
- nested element source inheritance,
- multi-select output,
- review context highlighting,
- runtime DOM fallback diagnostics.

## How It Works

Astro annotates development HTML with `data-astro-source-file` and
`data-astro-source-loc`. Astro's own Audit toolbar can remove those attributes
after startup, so this integration injects a page-level cache early during dev.

When an element is selected, Inspect & Clip:

1. reads cached Astro source metadata,
2. walks up the DOM when child elements need to inherit source context,
3. captures route, title, nearby heading/region/form, text, `data-*` attributes,
   and a compact DOM path for page-level context,
4. filters plugin-owned highlight classes out of copied HTML,
5. stores review comments in page-scoped session storage,
6. uses an instance fingerprint so repeated components are not confused.

## Requirements

- Astro 4, 5, or 6
- Node.js 18+

## API

No configuration is required.

```js
astroInspectClip()
```

## Development

```bash
npm install
npm run build
npm run demo
```

Useful checks before publishing:

```bash
npm run build
npx tsc --noEmit
npm publish --dry-run
```

## License

[MIT](./LICENSE)

---

<div align="center">

[Report a bug](https://github.com/XKonstX/astro-inspect-clip/issues) ·
[Request a feature](https://github.com/XKonstX/astro-inspect-clip/issues) ·
[npm](https://www.npmjs.com/package/astro-inspect-clip)

</div>
