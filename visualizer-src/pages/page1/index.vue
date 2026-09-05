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
        message="pm.environment.set() only works here in the local IDE mock"
        description="Real Postman's visualizer can't call pm.environment.set() at all — same limitation as the Config page's warning. This button does something locally (pmMock.js implements pm.environment for dev), but will silently do nothing once pasted into Postman's actual visualizer."
        style="margin-bottom: 12px"
    />

    <Space direction="vertical" style="width: 100%" size="small">
      <Input v-model:value="testUrl" placeholder="https://example.com" />
      <Button @click="setTestUrl">Set testUrl</Button>
      <p v-if="lastSetValue" class="hint">
        Last set via <code>pm.environment.set("testUrl", ...)</code>: <code>{{ lastSetValue }}</code>
      </p>
    </Space>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
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

function setTestUrl() {
  // Works against pmMock.js's environment scope during `npm run dev` —
  // see the Alert above for why this specific call is a dev-only
  // convenience, not something that'll do anything once this component
  // is actually running inside Postman's real visualizer iframe.
  pm.environment.set('testUrl', testUrl.value)
  lastSetValue.value = testUrl.value
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
</style>