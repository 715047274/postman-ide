<template>
  <Card class="page" title="Page 1 — Counter">
    <Space align="center" size="middle">
      <Button @click="decrement">-</Button>
      <span class="count">{{ count }}</span>
      <Button type="primary" @click="increment">+</Button>
    </Space>
    <div class="detail-link">
      <Button type="link" @click="navigate('page1.detail')">See detail →</Button>
    </div>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import { Card, Space, Button } from 'ant-design-vue'
import { navigate } from '../router.js'

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
</script>

<style scoped>
.count {
  font-size: 24px;
  font-weight: bold;
}
.detail-link {
  margin-top: 12px;
}
</style>
