<template>
  <Card class="page" title="Page 2 — Response Data">
    <Spin :spinning="loading">
      <p>{{ summary }}</p>
    </Spin>
  </Card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Card, Spin } from 'ant-design-vue'

const summary = ref('Loading...')
const loading = ref(true)

onMounted(() => {
  pm.getData((error, data) => {
    summary.value = error
      ? 'Error loading response data'
      : data && data.name
        ? `Name: ${data.name}`
        : 'No "name" field in the response'
    loading.value = false
  })
})
</script>
