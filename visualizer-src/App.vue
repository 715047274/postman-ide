<template>
  <div class="app-shell">
    <h1>Postman Visualizer Demo (Vue, custom router + antd-vue)</h1>
    <Tabs :activeKey="currentRoute" @change="navigate">
      <TabPane v-for="item in navItems" :key="item.name" :tab="item.label" />
    </Tabs>
    <component :is="resolveComponent(currentRoute)" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Tabs } from 'ant-design-vue'
// antd-vue v4 ships CSS-in-JS for most components (injected at runtime
// via DOM style tags, not eval), but the base reset still needs an
// explicit import. Imported here — not main.js — so it's present
// whichever entry point actually runs (see pmMock.js for the same
// reasoning).
import 'ant-design-vue/dist/reset.css'
import './pmMock.js'
import { currentRoute, navigate, navItems, resolveComponent, beforeEach } from './router/index.js'

const TabPane = Tabs.TabPane

// A global guard — runs before every navigation, regardless of route.
// Logging here; return `false` from a guard to cancel navigation, or a
// route name (string) to redirect, same as router/routes.js's
// page1.detail example does per-route.
beforeEach((to, from) => {
  console.log(`[guard] navigating: "${from.name}" → "${to.name}"`, to.params)
})

onMounted(() => {
  console.log('[visualizer] App mounted, current route:', currentRoute.value)
})
</script>

<style>
.app-shell {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 16px;
}
.page {
  margin: 20px auto;
  max-width: 640px;
  text-align: left;
}
</style>