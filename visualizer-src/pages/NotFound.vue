<template>
  <Result status="404" :title="`No page for ${currentRoute}`">
    <template #extra>
      <Button type="primary" @click="navigate('page1')">Go to Page 1</Button>
    </template>
  </Result>
</template>

<script setup>
import { Result, Button } from 'ant-design-vue'
import { currentRoute, navigate } from '../router.js'
</script>
