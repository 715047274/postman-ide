<template>
  <div class="app-shell">
    <h1>Postman Visualizer Demo (Vue, custom router + antd-vue)</h1>
    <Tabs :activeKey="currentRoute" @change="navigate">
      <TabPane key="page1" tab="Page 1" />
      <TabPane key="page1.detail" tab="Page 1 · Detail" />
      <TabPane key="page2" tab="Page 2" />
      <TabPane key="config" tab="Config" />
    </Tabs>
    <component :is="routes[currentRoute] || NotFound" />
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
import { currentRoute, navigate } from './router.js'
import Page1 from './pages/Page1.vue'
import Page1Detail from './pages/Page1Detail.vue'
import Page2 from './pages/Page2.vue'
import Config from './pages/Config.vue'
import NotFound from './pages/NotFound.vue'

const TabPane = Tabs.TabPane

// A plain object, not reactive — the set of available pages never
// changes at runtime, only which one is currently selected does (that's
// `currentRoute`, imported above). Dynamic dispatch happens entirely via
// Vue's built-in <component :is="...">, no router library involved.
const routes = {
  page1: Page1,
  'page1.detail': Page1Detail,
  page2: Page2,
  config: Config
}

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
