<template>
  <div class="panel">
    <div class="panel__header">
      <span>Response</span>
      <span v-if="error" class="status-pill status-pill--error">Invalid JSON</span>
    </div>
    <textarea class="code-block code-block--editable" v-model="draft" spellcheck="false" @input="handleInput" />
    <div class="panel__footnote">
      This is a static preview only — the running visualizer (in the panel below) reads its own
      <code>pm.getData</code> mock defined in <code>visualizer-src/main.js</code>, not this textarea. Edit that file
      to change what the visualizer sees.
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const model = defineModel({ default: () => ({}) })
const draft = ref(JSON.stringify(model.value, null, 2))
const error = ref(false)

watch(
  model,
  (value) => {
    draft.value = JSON.stringify(value, null, 2)
  },
  { deep: true }
)

function handleInput() {
  try {
    model.value = JSON.parse(draft.value)
    error.value = false
  } catch {
    error.value = true
  }
}
</script>
