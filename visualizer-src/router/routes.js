import Page1 from '../pages/page1/index.vue'
import Page1Detail from '../pages/page1/detail.vue'
import Page2 from '../pages/page2/index.vue'
import Config from '../pages/config/index.vue'
import NotFound from '../pages/NotFound.vue'

// The single source of truth for what pages exist and how they nest —
// App.vue no longer imports page components or maintains its own routes
// map; everything reads from this tree via router/index.js.
//
// `children` exists for organization (grouping "page1" and its "detail"
// sub-view together), same reason vue-router lets you nest route configs
// even without rendering nested <router-view>s — see router/index.js's
// `flatten()` for how a child's route is resolved exactly like a
// top-level one; there's no special nested-rendering behavior here.
export const routes = [
    {
        name: 'page1',
        path: 'page1',
        label: 'Page 1',
        component: Page1,
        children: [
            {
                name: 'page1.detail',
                path: 'page1.detail',
                label: 'Page 1 · Detail',
                component: Page1Detail,
                // Example per-route guard: only reachable when navigated to with
                // an `id` param (e.g. via navigate('page1.detail', { id: 5 })) —
                // clicking straight to the "Page 1 · Detail" tab with no param
                // gets redirected back to page1 instead. Return `false` to block
                // outright with no redirect, or omit `beforeEnter` entirely for
                // a route with no restrictions (page1, page2, config below).
                beforeEnter(to) {
                    if (to.params.id === undefined) {
                        console.log('[route guard] page1.detail requires an "id" param — redirecting to page1')
                        return 'page1'
                    }
                }
            }
        ]
    },
    {
        name: 'page2',
        path: 'page2',
        label: 'Page 2',
        component: Page2
    },
    {
        name: 'config',
        path: 'config',
        label: 'Config',
        component: Config
    }
]

// Not part of the nav bar (no tab is rendered for it) — router/index.js's
// resolveComponent() falls back to this whenever a route name doesn't
// match anything above, e.g. a stale value left over in localStorage
// from a route that's since been renamed or removed.
export const notFoundRoute = { name: 'not-found', path: '*', component: NotFound }