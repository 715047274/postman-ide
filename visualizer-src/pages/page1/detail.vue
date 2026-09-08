<template>
  <Card class="page" title="Page 1 — Detail">
    <p>
      Navigated here with route param <Tag color="purple">id = {{ currentParams.id }}</Tag>
    </p>
    <p>Raw value currently in <code>localStorage.counter</code>:</p>
    <Tag color="blue">{{ rawValue }}</Tag>
    <div class="back-link">
      <Button type="link" @click="navigate('page1')">← Back to Page 1</Button>
    </div>

    <Divider>Axios POST proof of concept</Divider>
    <p class="hint">
      Confirms the visualizer can make real outbound API calls with axios, not just <code>fetch()</code> — same
      underlying capability (CSP's <code>script-src</code> restriction doesn't govern outbound requests at all, only
      what can execute as a script), just a different library.
    </p>
    <Button type="primary" :loading="posting" @click="postExample">POST to jsonplaceholder</Button>
    <pre v-if="postResult" class="code-block">{{ postResult }}</pre>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Card, Tag, Button, Divider } from 'ant-design-vue'
import { navigate, currentParams } from '../../router/index.js'

// Deliberately re-reads from localStorage directly rather than sharing
// Page1's `count` ref — these are two separate components, mounted one
// at a time by <component :is>, with no shared component-level state.
// localStorage is the thing they actually share, same as Postman would
// re-render this visualizer fresh on every Send. `currentParams.id`
// above is different — that's the route param passed via
// navigate('page1.detail', { id }), not derived from localStorage at all.
const rawValue = ref(localStorage.getItem('counter'))

const posting = ref(false)
const postResult = ref('')

async function postExample() {
  posting.value = true
  postResult.value = ''
  try {
    // jsonplaceholder.typicode.com is a public fake REST API made for
    // exactly this — it accepts POSTs and echoes back a fabricated
    // resource (with a generated id), no auth needed.
    const res = await axios.post('https://jsonplaceholder.typicode.com/posts', {
      title: 'Hello from the Postman visualizer',
      body: "Testing axios POST inside Postman's visualizer",
      userId: currentParams.id ?? 1
    })
    postResult.value = JSON.stringify(res.data, null, 2)
  } catch (err) {
    postResult.value = `Error: ${err.message}`
  } finally {
    posting.value = false
  }
}
</script>

<style scoped>
.back-link {
  margin-top: 12px;
}
.hint {
  font-size: 12px;
  color: #666;
}
.code-block {
  background: #f5f5f5;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow: auto;
  white-space: pre;
  margin-top: 10px;
}
</style>