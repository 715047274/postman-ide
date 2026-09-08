import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { ViteMinifyPlugin } from 'vite-plugin-minify'

// This build's root is visualizer-src/, not the project root — it's a
// completely separate app from the IDE shell, because its output has to
// satisfy a real constraint (no runtime eval) that the IDE shell doesn't.
//
// @vitejs/plugin-vue compiles every .vue file's <template> into a plain
// render() function AT BUILD TIME, here, in Node — never in the browser.
// The compiled output that ships is just function calls (h(), openBlock(),
// createElementVNode(), etc.), the same primitives the runtime-only Vue
// build exposes. vite-plugin-singlefile then inlines all of that (plus
// Vue's runtime itself) into one HTML file with no external chunks.
//
// build.minify defaults to true (esbuild/Oxc) already, which covers the
// JS and CSS content — but Vite has no built-in HTML minifier, so the
// surrounding markup (indentation, whitespace between tags) stays as
// vite-plugin-vue/vite-plugin-singlefile emit it. ViteMinifyPlugin below
// collapses that too, since a smaller, fully-compact single blob is
// unambiguously better for something meant to be pasted into Postman.
export default defineConfig({
  root: 'visualizer-src',
  plugins: [vue(), viteSingleFile(), ViteMinifyPlugin({})],
  build: {
    outDir: '../dist-visualizer',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false
  }
})