<template>
  <Card class="page" title="Page 1 — Counter">
    <Space align="center" size="middle">
      <Button @click="decrement">-</Button>
      <span class="count">{{ count }}</span>
      <Button type="primary" @click="increment">+</Button>
    </Space>
    <div class="detail-link">
      <Button type="link" @click="navigate('page1.detail', { id: count })">See detail (id={{ count }}) →</Button>
    </div>

    <Divider />

    <Alert
        type="warning"
        show-icon
        message="pm.environment.set() cannot run from inside the visualizer, ever"
        description="Real Postman's visualizer pm object only exposes pm.getData() — pm.environment doesn't exist on it at all, so calling pm.environment.set() here throws in real Postman (it only appears to work in npm run dev because pmMock.js provides a full pm.environment for local testing). To get a real, other-requests-can-use-it environment variable, generate the script below and paste it into the Pre-request Script or Tests tab instead — same pattern as the Config page."
        style="margin-bottom: 12px"
    />

    <Space direction="vertical" style="width: 100%" size="small">
      <Input v-model:value="testUrl" placeholder="https://example.com" />
      <Button @click="setTestUrlLocal">Set testUrl (dev mock only — won't work pasted into Postman)</Button>
      <p v-if="lastSetValue" class="hint">
        Local mock updated via <code>pm.environment.set("testUrl", ...)</code>: <code>{{ lastSetValue }}</code>
      </p>

      <Divider style="margin: 8px 0" />

      <p class="hint">
        <strong>This is the part that actually works in real Postman:</strong> paste the script below into the
        request's (or Collection's) <strong>Pre-request Script</strong> or <strong>Tests</strong> tab — those run
        outside the visualizer, where <code>pm.environment</code> genuinely exists. After that,
        <code>{{ testUrlPlaceholder }}</code> is usable in any other request in the collection.
      </p>
      <pre class="code-block">{{ generatedScript }}</pre>
      <Button @click="copyScript">{{ copied ? 'Copied' : 'Copy script' }}</Button>
    </Space>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Card, Space, Button, Divider, Alert, Input } from 'ant-design-vue'
import { navigate } from '../../router/index.js'

const count = ref(
    localStorage.getItem('counter') ? parseInt(localStorage.getItem('counter'), 10) : 0
)

function increment() {
  count.value++
  localStorage.setItem('counter', count.value)
}
function decrement() {
  count.value--
  localStorage.setItem('counter', count.value)
}

const testUrl = ref('')
const lastSetValue = ref('')

// A plain variable, not an inline string in the template — Vue's mustache
// parser does naive text-based `}}` matching (not real JS parsing), so
// `{{ '{{testUrl}}' }}` breaks: the `}}` inside the string literal closes
// the interpolation early, leaving an unterminated string. Referencing a
// script-level identifier with no embedded braces sidesteps that entirely.
const testUrlPlaceholder = '{{testUrl}}'

// Kept for local dev convenience (see the Alert above) — this call
// itself is exactly what fails in real Postman, since it's reaching
// pm.environment from inside the visualizer, which is never reachable
// there no matter what build this component ends up in.
function setTestUrlLocal() {
  pm.environment.set('testUrl', testUrl.value)
  lastSetValue.value = testUrl.value
}

// JSON.stringify both escapes quotes/special characters in whatever the
// user typed AND produces a valid JS string literal — same approach
// Config.vue's generator uses for the same reason.
const generatedScript = computed(() => `pm.environment.set("testUrl", ${JSON.stringify(testUrl.value)});`)

const copied = ref(false)
async function copyScript() {
  await navigator.clipboard.writeText(generatedScript.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<style scoped>
.count {
  font-size: 24px;
  font-weight: bold;
}
.detail-link {
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
}
</style>