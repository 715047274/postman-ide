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
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import { Card, Tag, Button } from 'ant-design-vue'
import { navigate, currentParams } from '../../router'

// Deliberately re-reads from localStorage directly rather than sharing
// Page1's `count` ref — these are two separate components, mounted one
// at a time by <component :is>, with no shared component-level state.
// localStorage is the thing they actually share, same as Postman would
// re-render this visualizer fresh on every Send.
const rawValue = ref(localStorage.getItem('counter'))
</script>

<style scoped>
.back-link {
  margin-top: 12px;
}
</style>
