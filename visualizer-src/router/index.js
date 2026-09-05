import { ref, reactive } from 'vue'
import { routes, notFoundRoute } from './routes.js'

const STORAGE_KEY = 'visualizerRoute'
const PARAMS_STORAGE_KEY = 'visualizerRouteParams'

// Deliberately NOT the History API (no createWebHistory/
// createWebHashHistory, no pushState) — this visualizer runs inside
// Postman's own iframe, which has no real URL of its own to navigate,
// and touching the parent page's history would be actively wrong here.
// A "route" is just a name resolved to a component below, persisted to
// localStorage so the current page survives Postman re-rendering the
// visualizer (e.g. on every Send) — same reason Counter's count survives
// it.
//
// Route params follow from the same constraint: there's no real URL to
// encode "detail/1" into, so params are just a plain object passed
// alongside the route name — `navigate('page1.detail', { id: 1 })`,
// not a `:id` path pattern that gets string-parsed. Functionally
// equivalent to vue-router's `params`, just skipping the URL-string
// round-trip that has nothing to serialize into here.

// Flattens the route tree (routes + their children, recursively) into a
// single list. <component :is> and the nav bar both just need "given a
// route name, what's its component/label/guard?" — they don't care
// about the tree shape, which exists purely for authoring/organization
// in routes.js, the same way vue-router accepts nested route configs
// without requiring nested <router-view>s to use them.
function flatten(routeList, acc = []) {
    for (const route of routeList) {
        acc.push(route)
        if (route.children) flatten(route.children, acc)
    }
    return acc
}

const flatRoutes = flatten(routes)
const routesByName = Object.fromEntries(flatRoutes.map((r) => [r.name, r]))

// What the nav bar renders — derived from routes.js, never hand-maintained.
export const navItems = flatRoutes.map((r) => ({ name: r.name, label: r.label }))

export const currentRoute = ref(localStorage.getItem(STORAGE_KEY) || flatRoutes[0]?.name || '')

function loadParams() {
    try {
        return JSON.parse(localStorage.getItem(PARAMS_STORAGE_KEY)) || {}
    } catch {
        return {}
    }
}

// `reactive`, not `ref` — pages read individual fields off this
// (`currentParams.id`) without needing `.value`.
export const currentParams = reactive(loadParams())

function persistParams() {
    localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(currentParams))
}

// ---------------------------------------------------------------------
// Navigation guards — same semantics as vue-router's beforeEach/
// beforeEnter: a guard receives (to, from) and can return
//   - `false`         → cancel the navigation entirely
//   - a route name     → redirect there instead (re-runs all guards
//                        against the new target, so a redirect can
//                        itself be blocked or redirected again)
//   - anything else     → allow the navigation through
// Global guards (registered via beforeEach) run first, in registration
// order; a route's own `beforeEnter` (defined in routes.js) runs after,
// only when navigating to that specific route.
// ---------------------------------------------------------------------
const globalGuards = []

export function beforeEach(guardFn) {
    globalGuards.push(guardFn)
    // Returns an unregister function, mirroring vue-router's beforeEach.
    return () => {
        const index = globalGuards.indexOf(guardFn)
        if (index !== -1) globalGuards.splice(index, 1)
    }
}

export function navigate(routeName, params = {}) {
    const to = { name: routeName, params }
    const from = { name: currentRoute.value, params: { ...currentParams } }

    for (const guard of globalGuards) {
        const result = guard(to, from)
        if (result === false) {
            console.log(`[router] navigation to "${routeName}" cancelled by a beforeEach guard`)
            return
        }
        if (typeof result === 'string') {
            console.log(`[router] beforeEach guard redirected "${routeName}" → "${result}"`)
            navigate(result, params)
            return
        }
    }

    const targetRoute = routesByName[routeName]
    if (targetRoute?.beforeEnter) {
        const result = targetRoute.beforeEnter(to, from)
        if (result === false) {
            console.log(`[router] navigation to "${routeName}" cancelled by its beforeEnter guard`)
            return
        }
        if (typeof result === 'string') {
            navigate(result, params)
            return
        }
    }

    currentRoute.value = routeName
    localStorage.setItem(STORAGE_KEY, routeName)

    // Each navigation replaces params wholesale, not merges — a fresh
    // navigation shouldn't inherit params meant for a different page.
    for (const key of Object.keys(currentParams)) delete currentParams[key]
    Object.assign(currentParams, params)
    persistParams()
}

export function resolveComponent(routeName) {
    return (routesByName[routeName] || notFoundRoute).component
}