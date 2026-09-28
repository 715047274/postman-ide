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

// ---------------------------------------------------------------------
// sendRequest(options, callback) — a drop-in stand-in for pm.sendRequest,
// same signature and same shapes in and out, so that calling code (see
// api/loginApi.js) is already written the way it will eventually need to
// look in a real Postman script. Porting later is meant to be: swap this
// import for the real `pm.sendRequest`, delete this file. The call sites
// themselves shouldn't need to change.
//
// pm.sendRequest's real signature (Postman's own docs):
//   pm.sendRequest(options, (err, response) => { ... })
//   options: {
//     url: string,
//     method: 'GET' | 'POST' | ...,
//     header: { [name]: value },              // note: "header", not "headers"
//     body: {
//       mode: 'urlencoded' | 'raw',
//       urlencoded?: [{ key, value }],
//       raw?: string
//     }
//   }
//   response (only on success): {
//     code: number,
//     headers: { get(name) },
//     text(): string,
//     json(): object
//   }
//
// This dev-mode version runs on axios (through the same `client` above,
// so it still gets the dev-proxy CORS workaround for free), converts the
// pm-shaped `options` into an axios config, and wraps the axios response
// back into the pm-shaped `response` object.
// ---------------------------------------------------------------------
export function sendRequest(options, callback) {
    let config
    try {
        config = toAxiosConfig(options)
    } catch (err) {
        callback(err, null)
        return
    }

    client
        .request(config)
        .then((response) => {
            callback(null, wrapResponse(response))
        })
        .catch((err) => {
            if (err.response) {
                // Mirrors pm.sendRequest: a 4xx/5xx target response is still a
                // "successful" call as far as the callback is concerned — err is
                // null, and resp.code carries the status.
                callback(null, wrapResponse(err.response))
            } else {
                callback(err, null)
            }
        })
}

function toAxiosConfig(options) {
    if (!options || typeof options.url !== 'string') {
        throw new Error('sendRequest: options.url is required')
    }

    const config = {
        url: options.url,
        method: (options.method || 'GET').toLowerCase(),
        headers: { ...(options.header || {}) }
    }

    const body = options.body
    if (body) {
        if (body.mode === 'urlencoded') {
            const params = new URLSearchParams()
            for (const { key, value } of body.urlencoded || []) {
                params.append(key, value)
            }
            config.data = params.toString()
            if (!hasHeader(config.headers, 'content-type')) {
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
        } else if (body.mode === 'raw') {
            config.data = body.raw
        } else if (body.mode) {
            throw new Error(`sendRequest: unsupported body.mode "${body.mode}"`)
        }
    }

    return config
}

function hasHeader(headers, name) {
    return Object.keys(headers).some((k) => k.toLowerCase() === name.toLowerCase())
}

// Wraps an axios response into the same shape pm.sendRequest hands your
// callback, so calling code never has to know it's really axios.
function wrapResponse(response) {
    const headers = response.headers || {}
    return {
        code: response.status,
        headers: {
            get: (name) => headers[String(name).toLowerCase()]
        },
        text: () => (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
        json: () => (typeof response.data === 'string' ? JSON.parse(response.data) : response.data)
    }
}