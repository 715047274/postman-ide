import { ref } from 'vue'

const STORAGE_KEY = 'visualizerRoute'

// A "route" here is just a plain string key into the `routes` map in
// App.vue — e.g. "page1" or "page1.detail". Deliberately NOT the History
// API (no createWebHistory/createWebHashHistory, no pushState): this
// visualizer runs inside Postman's own iframe, which has no real URL of
// its own to navigate, and touching the parent page's history would be
// actively wrong here, not just unnecessary.
//
// Persisting to localStorage means the current page survives Postman
// re-rendering the visualizer (e.g. on every Send) — the same reason
// Counter's count survives it. Dot-separated names like "page1.detail"
// are just a naming convention for readability; there's no parsing of
// the dots, it's a flat string key either way.
export const currentRoute = ref(localStorage.getItem(STORAGE_KEY) || 'page1')

export function navigate(routeName) {
  currentRoute.value = routeName
  localStorage.setItem(STORAGE_KEY, routeName)
}
