import { ref, reactive } from 'vue'
import { routes, notFoundRoute } from './routes.js'

const STORAGE_KEY = 'visualizerRoute'
const PARAMS_STORAGE_KEY = 'visualizerRouteParams'

// Deliberately NOT the History API — see earlier comments in this file's
// history; a "route" is just a name resolved to a component, persisted
// to localStorage so state survives Postman re-rendering the visualizer.

// Flattens the route tree, tracking each route's ancestor chain as it
// goes (chain = [root, ..., self]) — that chain is what getBreadcrumb()
// below walks to build "Home > Page 1 > Detail". <component :is> and
// the nav bar only need "given a route name, what's its component/
// label/guard?"; the chain only matters for the breadcrumb.
function flatten(routeList, parentChain = [], acc = []) {
    for (const route of routeList) {
        const chain = [...parentChain, route]
        acc.push({ ...route, chain })
        if (route.children) flatten(route.children, chain, acc)
    }
    return acc
}

const flatRoutes = flatten(routes)
const routesByName = Object.fromEntries(flatRoutes.map((r) => [r.name, r]))

// Every route, flattened — used where "all pages, nested or not" makes
// sense (this was previously what the nav bar itself rendered).
export const navItems = flatRoutes.map((r) => ({ name: r.name, label: r.label }))

// Only root-level routes — what Layout.vue's top nav (<a-menu>) actually
// shows. page1.detail deliberately isn't in here: it requires an `id`
// param (see routes.js's beforeEnter), so a plain top-level nav click
// with no param would just bounce it back to page1 anyway. It's still
// reachable normally, just via a contextual link (Page 1's "See detail"
// button) rather than the top nav — the breadcrumb is what reveals you're
// inside it once you are.
export const topLevelNavItems = flatRoutes.filter((r) => r.chain.length === 1).map((r) => ({ name: r.name, label: r.label }))

export const currentRoute = ref(localStorage.getItem(STORAGE_KEY) || flatRoutes[0]?.name || '')

function loadParams() {
    try {
        return JSON.parse(localStorage.getItem(PARAMS_STORAGE_KEY)) || {}
    } catch {
        return {}
    }
}

export const currentParams = reactive(loadParams())

function persistParams() {
    localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(currentParams))
}

// ---------------------------------------------------------------------
// Navigation guards — see routes.js's page1.detail entry for a concrete
// beforeEnter example. Semantics match vue-router's beforeEach/
// beforeEnter: return `false` to cancel, a route name to redirect,
// anything else to allow through.
// ---------------------------------------------------------------------
const globalGuards = []

export function beforeEach(guardFn) {
    globalGuards.push(guardFn)
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

    for (const key of Object.keys(currentParams)) delete currentParams[key]
    Object.assign(currentParams, params)
    persistParams()
}

export function resolveComponent(routeName) {
    return (routesByName[routeName] || notFoundRoute).component
}

// Returns [{ name, label }, ...] from root to the given route, for
// Layout.vue's <a-breadcrumb>. An unknown route name (stale localStorage
// value, same case resolveComponent() falls back to NotFound for)
// returns an empty chain rather than throwing.
export function getBreadcrumb(routeName) {
    const route = routesByName[routeName]
    if (!route) return []
    return route.chain.map((r) => ({ name: r.name, label: r.label }))
}