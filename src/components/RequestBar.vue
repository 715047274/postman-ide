<template>
  <div class="panel">
    <div class="panel__header">
      <span>Request</span>
      <span v-if="status !== null" class="status-pill" :class="status === 'error' ? 'status-pill--error' : 'status-pill--ok'">
        {{ status === 'error' ? 'Error' : `Status ${status}` }}
      </span>
    </div>
    <div class="request-bar">
      <select v-model="method" class="request-bar__method">
        <option v-for="m in METHODS" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
          v-model="url"
          class="request-bar__url"
          placeholder="https://api.example.com/resource or {{testUrl}}/path"
          spellcheck="false"
      />
      <button class="request-bar__send" :disabled="loading" @click="$emit('send')">
        {{ loading ? 'Sending…' : 'Send' }}
      </button>
    </div>
    <div v-if="hasVariables" class="request-bar__resolved">Resolves to: <code>{{ resolvedUrl }}</code></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

defineProps({
  loading: Boolean,
  status: { type: [Number, String], default: null }
})
defineEmits(['send'])

const method = defineModel('method')
const url = defineModel('url')

const hasVariables = computed(() => /\{\{\w+\}\}/.test(url.value || ''))

// pm.variables.replaceIn walks local → collection → environment →
// global, the same precedence real Postman uses for {{var}} in a URL
// bar. Guarded since window.pm is installed by pmMock.js as a side
// effect of the visualizer being imported (see VisualizerPanel.vue) —
// it's present by the time anything actually renders (module imports
// resolve fully before any component's setup() runs), but this stays
// defensive rather than assuming that ordering never changes.
const resolvedUrl = computed(() => {
  if (typeof window.pm === 'undefined') return url.value
  return window.pm.variables.replaceIn(url.value || '')
})
</script>