<template>
  <Layout class="layout">
    <LayoutHeader>
      <div class="logo" />
      <Menu
          :selectedKeys="[currentRoute]"
          theme="dark"
          mode="horizontal"
          :style="{ lineHeight: '64px' }"
          @click="handleMenuClick"
      >
        <MenuItem v-for="item in topLevelNavItems" :key="item.name">{{ item.label }}</MenuItem>
      </Menu>
    </LayoutHeader>
    <LayoutContent style="padding: 0 50px">
      <Breadcrumb style="margin: 16px 0">
        <BreadcrumbItem>Home</BreadcrumbItem>
        <BreadcrumbItem v-for="crumb in breadcrumb" :key="crumb.name">{{ crumb.label }}</BreadcrumbItem>
      </Breadcrumb>
      <div :style="{ background: '#fff', padding: '24px', minHeight: '280px' }">
        <!--
          The actual page (whatever <component :is="resolveComponent(...)" />
          resolves to in App.vue) is passed in here as default slot content
          — Layout.vue doesn't know or care which page it is, same reason
          real vue-router's <router-view> doesn't know either.
        -->
        <slot />
      </div>
    </LayoutContent>
    <LayoutFooter style="text-align: center"> Postman Visualizer Demo — built with Vue + antd-vue </LayoutFooter>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
// ant-design-vue's compound components (Layout.Header/.Content/.Footer,
// Menu.Item, Breadcrumb.Item) are accessed as properties of the parent
// import, then used as PascalCase tags — the same pattern Tabs.TabPane
// uses elsewhere in this project. Kebab-case tags like <a-layout> (the
// form ant-design-vue's own docs show) only resolve automatically when
// the whole library is registered globally via app.use(Antd) in main.js,
// which this project deliberately doesn't do (per-component imports
// keep things tree-shakeable) — so they're translated to PascalCase here.
import { Layout, Menu, Breadcrumb } from 'ant-design-vue'
import { currentRoute, navigate, topLevelNavItems, getBreadcrumb } from '../router/index.js'

const LayoutHeader = Layout.Header
const LayoutContent = Layout.Content
const LayoutFooter = Layout.Footer
const MenuItem = Menu.Item
const BreadcrumbItem = Breadcrumb.Item

// a-menu's @click payload is { key, keyPath, item, domEvent } — key is
// whatever we gave :key on the menu item, i.e. the route name, so this
// is just navigate(key) same as clicking anywhere else in the app.
function handleMenuClick({ key }) {
  navigate(key)
}

const breadcrumb = computed(() => getBreadcrumb(currentRoute.value))
</script>

<style scoped>
.logo {
  width: 120px;
  height: 31px;
  margin: 16px 24px 16px 0;
  background: rgba(255, 255, 255, 0.3);
  float: left;
}
</style>