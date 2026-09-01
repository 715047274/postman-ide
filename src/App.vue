<template>
  <div class="app">
    <header class="app-header">
      <span class="app-header__badge">Vite + Vue</span>
      <h1>Postman Visualizer IDE</h1>
      <p>Real .vue templates, precompiled by @vitejs/plugin-vue — zero runtime eval either way.</p>
    </header>

    <RequestBar
      v-model:method="method"
      v-model:url="url"
      :loading="loading"
      :status="status"
      @send="handleSend"
    />

    <div class="app-grid">
      <ScriptPanel />
      <ResponsePanel v-model="response" />
    </div>

    <VisualizerPanel />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RequestBar from './components/RequestBar.vue'
import ScriptPanel from './components/ScriptPanel.vue'
import ResponsePanel from './components/ResponsePanel.vue'
import VisualizerPanel from './components/VisualizerPanel.vue'

const method = ref('GET')
const url = ref('https://echo.postman-echo.com/get')
const status = ref(null)
const loading = ref(false)
const response = ref({
  id: 1,
  name: 'Sample item',
  tags: ['alpha', 'beta']
})

async function handleSend() {
  loading.value = true
  status.value = null
  try {
    const res = await fetch(url.value, { method: method.value })
    const contentType = res.headers.get('content-type') || ''
    response.value = contentType.includes('application/json') ? await res.json() : { text: await res.text() }
    status.value = res.status
  } catch (err) {
    status.value = 'error'
    response.value = { error: String(err) }
  } finally {
    loading.value = false
  }
}
</script>
