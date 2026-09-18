import axios from 'axios'

// A single configured axios instance — every API call in this app goes
// through this, so shared config (timeout, default headers, the dev
// proxy interceptors below) only needs to live in one place.
//
// No baseURL set here deliberately: the environments this app talks to
// each have their own baseUrl (see config/environments.js), decided per
// call rather than fixed for the whole client.
const client = axios.create({
    timeout: 20000,
    headers: {
        'Accept-Language': 'en-US,en;q=0.9'
    }
})

const PROXY_SERVER = 'http://localhost:5175/request'

// A stable id for this login attempt, so the dev proxy server's cookie
// jar (see scripts/dev-proxy-server.mjs) persists across multiple calls
// — the login POST, then later an oidc/postsignin POST — instead of each
// call looking like a fresh, cookie-less session. Regenerate this (or
// call DELETE /session/:id) between separate login attempts if you don't
// want state carrying over from a previous one.
export const devSessionId = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`

// Dev-only CORS workaround. Real Dayforce environments almost certainly
// don't send Access-Control-Allow-Origin headers permitting cross-origin
// XHR — they're built for normal page navigation, not being called from
// another origin's JS, and this particular login flow adds multi-hop
// redirects across domains on top of that (see dev-proxy-server.mjs's
// top comment for why a simple reverse proxy isn't enough here). This
// interceptor rewrites any absolute http(s) request into a POST to the
// dev proxy server instead, which does the real request (redirects,
// cookies, and all) server-side, where CORS doesn't apply.
//
// import.meta.env.DEV is a Vite build-time constant — `false` in the
// production build (npm run build:visualizer), so this whole block is
// dead code there and gets tree-shaken out, same mechanism as
// pmMock.js's install guard. The built script that goes into Postman
// has no dev proxy server underneath it — that needs pm.sendRequest
// instead, a separate, not-yet-built piece (see api/loginApi.js).
if (import.meta.env.DEV) {
    client.interceptors.request.use((config) => {
        if (typeof config.url === 'string' && /^https?:\/\//.test(config.url)) {
            const target = {
                url: config.url,
                method: config.method || 'get',
                headers: config.headers || {},
                body: config.data,
                sessionId: devSessionId
            }
            config.method = 'post'
            config.url = PROXY_SERVER
            config.data = target
            config.headers = { 'Content-Type': 'application/json' }
        }
        return config
    })

    client.interceptors.response.use((response) => {
        // Only reshape responses that actually went through the proxy —
        // leaves any other response (there shouldn't be any once the
        // request interceptor above has run, but stay defensive) untouched.
        if (response.config.url !== PROXY_SERVER) return response

        const { status, headers, body } = response.data
        response.status = status
        response.headers = headers
        response.data = body

        // The proxy server itself never throws for a 4xx/5xx target
        // response (validateStatus: () => true on its side) — restore
        // normal axios error-throwing behavior here so calling code's
        // try/catch works the same as it would for a direct request.
        if (status >= 400) {
            const err = new Error(`Request failed with status ${status}`)
            err.response = response
            throw err
        }

        return response
    })
}

export default client