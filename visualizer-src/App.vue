<template>
  <Layout>
    <component :is="resolveComponent(currentRoute)" />
  </Layout>
</template>

<script setup>
import { onMounted } from 'vue'
// antd-vue v4 ships CSS-in-JS for most components (injected at runtime
// via DOM style tags, not eval), but the base reset still needs an
// explicit import. Imported here — not main.js — so it's present
// whichever entry point actually runs (see pmMock.js for the same
// reasoning).
import 'ant-design-vue/dist/reset.css'
import './pmMock.js'
import Layout from './container/Layout.vue'
import { currentRoute, resolveComponent, beforeEach } from './router/index.js'

// A global guard — runs before every navigation, regardless of route.
// Logging here; return `false` from a guard to cancel navigation, or a
// route name (string) to redirect, same as routes.js's page1.detail
// example does per-route.
beforeEach((to, from) => {
  console.log(`[guard] navigating: "${from.name}" → "${to.name}"`, to.params)
})

onMounted(() => {
  console.log('[visualizer] App mounted, current route:', currentRoute.value)
})
</script>

<style>
.page {
  text-align: left;
}
</style>