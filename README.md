# Postman Visualizer IDE (Vue + Vite)

One dev server, same as the Alpine version of this project:

- **`src/`** — the IDE shell (Request bar, build instructions, a live
  preview panel). `npm run dev`, ordinary Vue app.
- **`visualizer-src/App.vue`** — the actual visualizer. A real `.vue`
  single-file component with a `<template>` block. The IDE's Visualizer
  panel imports and renders it **directly, inline, in the same page** —
  real component composition, real HMR from the same `vite` process. No
  second dev server, no iframe, no separate port to keep alive.

`npm run build:visualizer` is the only place a *second* Vite config comes
in (`vite.visualizer.config.js`) — it builds `visualizer-src/` on its own,
into a single self-contained HTML file, which then gets wrapped into a
`pm.visualizer.set(...)` script. That separate build exists because the
**output** has a real constraint the IDE shell doesn't (never eval
anything, since Postman's visualizer iframe forbids `unsafe-eval`) — not
because development needs two servers.

## Why this is safe without a special "CSP build"

Vue doesn't ship a CSP-specific build the way Alpine does. Instead:
`@vitejs/plugin-vue` compiles every `.vue` file's `<template>` into a
plain `render()` function **at build time, in Node** — the same compiler
package (`@vue/compiler-sfc` / `@vue/compiler-dom`) either way, just run
ahead of time instead of in the browser. The compiled output that ships is
ordinary function calls (`h()`, `createElementVNode()`, etc.), which the
Vue **runtime** (bundled in by Vite, no compiler included) executes
normally — no `eval`, no `new Function`, at any point after the build
finishes. Confirmed independently by reading the runtime-only Vue build's
source: its `compile` export is a literal no-op.

**Trade-off worth knowing:** the inline preview in the IDE shell runs in
the IDE's own page, sharing its origin and CSS — so it does *not* prove
CSP-safety the way the Alpine project's CSP-meta'd iframe did, and
`App.vue`'s plain (non-`scoped`) `<style>` can bleed into/from the IDE
shell's own styles a little, since there's no iframe boundary anymore.
It's for iterating on layout and logic quickly; the actual CSP guarantee
comes from `@vitejs/plugin-vue`'s build-time compilation itself (see
above), not from anything about the preview.

## Commands

```bash
npm install
npm run dev              # IDE shell + live visualizer preview — http://localhost:5173
npm run build:visualizer # writes dist/postman-script.js — paste into Postman
```

## Using it in Postman

1. `npm run build:visualizer`
2. Open `dist/postman-script.js`, copy everything.
3. In Postman: open your request → **Tests** tab → paste it in.
4. Hit **Send**, then open the **Visualize** tab on the response.

## Debugging a blank visualizer

Two `console.log` markers are already in `visualizer-src/main.js` /
`App.vue` (`'main.js running, about to mount'` / `'App mounted'`). If you
open `dist-visualizer/index.html` directly in a browser tab after running
`npm run build:visualizer` and:

- Neither log appears → the built JS never ran (a script-loading problem
  in the singlefile build itself).
- Both logs appear but nothing renders → Vue mounted, but nothing painted
  (CSS or template issue) — check devtools' Elements panel for the actual
  DOM Vue produced.
- Everything renders correctly here → the build is fine, and any problem
  in real Postman is specific to how Postman is handling the pasted
  script, not the Vue app itself.

## A note on what's actually verified here

This project was written and reasoned through carefully, but the
environment it was written in has no network access for `npm install` or
running an actual Vite build — so unlike the companion Alpine project
(verified against real fetched source of both the Alpine CSP build and
Vue's runtime-only build), the *build pipeline itself* hasn't been
executed end-to-end from this end. Running `npm install && npm run
build:visualizer` yourself is the step that turns "should work" into
"does work."

## Using ant-design-vue

Added as a real dependency (`ant-design-vue` in `package.json`) — its
components ship pre-compiled from npm (no `.vue` SFCs of its own for
Vite to compile), so using it doesn't reintroduce any template-compilation
risk. `App.vue` imports `ant-design-vue/dist/reset.css` and uses
`Tabs`/`TabPane` for navigation; the pages use `Card`, `Button`, `Space`,
`Tag`, `Spin`, `Result`. All imported via plain named imports
(`import { Button } from 'ant-design-vue'`) and used as PascalCase tags
in templates — no global registration, no auto-import plugin.

**Not independently verified the way Vue core and Alpine's CSP build
were in this project.** Ant Design Vue v4 uses `@ant-design/cssinjs` for
dynamic theming, which injects `<style>` tags via normal DOM APIs — that
should be fine under a `script-src`-only CSP like Postman's, but this is
my best understanding of a fairly large library, not something read
line-by-line the way the smaller Alpine/Vue-runtime builds were earlier
in this project. Before trusting it in real Postman: `npm run
build:visualizer`, then open `dist-visualizer/index.html` **directly** in
a browser tab (it still carries the real CSP meta tag — only the final
`dist/postman-script.js` has that stripped out) and check the console for
any CSP violation before assuming it's clean.

## Config page — and why it doesn't call pm.environment.set() directly

`visualizer-src/pages/Config.vue` manages an array of named environment
configs (matching the `autotest12_local_sp: { baseUrl, ..., gatewayContext: {...} }`
shape) via a form, persisted to `localStorage`. It deliberately does
**not** have a button that calls `pm.environment.set(...)` when clicked.

That's not a missing feature — it's a real Postman platform limitation,
confirmed against multiple Postman community threads going back to 2019
and a still-open GitHub feature request
(postmanlabs/postman-app-support#8341): the visualizer's `pm` object only
exposes `pm.getData()`. Any `pm.environment`, `pm.collectionVariables`,
etc. call made from inside the visualizer iframe silently does nothing —
same failure class as the earlier `pm is not defined` bug, just one level
subtler (no error, no effect).

Instead, the Config page **generates a script** — the whole `configs`
object plus a `pm.environment.get("activeInstanceName")` lookup — meant
for the request's or Collection's **Pre-request Script** tab, a
completely different execution context where `pm.environment` genuinely
works. Paste it once; after that, switching environments is just editing
the `activeInstanceName` value in Postman's own Environment editor, no
re-pasting required.
