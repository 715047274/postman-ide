<template>
  <div class="panel">
    <div class="panel__header">
      <span>Visualizer — Vue (live preview, same dev server)</span>
    </div>
    <div class="visualizer-frame">
      <VisualizerApp />
    </div>
    <div class="panel__footnote">
      This renders <code>visualizer-src/App.vue</code> directly, in this same page, via Vite's normal HMR — one
      dev server, same as the Alpine project. It does <strong>not</strong> enforce Postman's CSP locally (that
      guarantee comes from the precompiled build itself, not from this preview) — use it for iterating on layout and
      logic, then <code>npm run build:visualizer</code> when you want the real paste-into-Postman file.
    </div>
  </div>
</template>

<script setup>
import VisualizerApp from '../../visualizer-src/App.vue'
</script>
