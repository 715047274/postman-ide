// Dev-only proxy server. Run alongside `npm run dev` in a separate
// terminal: `npm run dev:proxy`.
//
// Why this exists instead of Vite's built-in server.proxy: this login
// flow redirects across multiple domains (login page → OIDC provider →
// postsignin), and relies on cookies set during one hop being sent on
// the next. A simple reverse proxy relays a 3xx response's Location
// header as-is — pointing at the real external domain — so the browser
// would try to follow it directly and hit CORS again on the very next
// hop. This server instead makes the ENTIRE request (redirects and all)
// itself, server-side, using axios with a cookie jar via
// axios-cookiejar-support/tough-cookie, and only ever hands the browser
// the final result. Since this is a Node process, not a browser, CORS
// never applies to any of it — same underlying reason pm.sendRequest
// never hits it either.
//
// This is dev-only tooling for testing the login flow against real
// staging servers locally. It has no equivalent in the built visualizer
// that goes into Postman — that needs pm.sendRequest instead (see
// api/loginApi.js's top comment).
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

const PORT = 5175
const DEV_ORIGIN = 'http://localhost:5173'

const app = express()
app.use(cors({ origin: DEV_ORIGIN }))
app.use(express.json({ limit: '5mb' }))

// One cookie jar per login "flow", keyed by a client-generated session
// id (see api/client.js's devSessionId). This is what lets a cookie set
// by the login POST (ASP.NET forms auth) actually be sent on the LATER
// oidc/postsignin POST — without this, every call would look like a
// fresh, cookie-less request to whatever server it's proxying to,
// breaking any flow relying on state carried across steps.
const jars = new Map()

function getJar(sessionId) {
    if (!jars.has(sessionId)) jars.set(sessionId, new CookieJar())
    return jars.get(sessionId)
}

app.post('/request', async (req, res) => {
    const { url, method = 'GET', headers = {}, body, sessionId = 'default' } = req.body

    if (!url) {
        res.status(400).json({ error: 'Missing "url" in request body' })
        return
    }

    const jar = getJar(sessionId)
    const proxiedClient = wrapper(axios.create({ jar }))

    try {
        const response = await proxiedClient.request({
            url,
            method,
            headers,
            data: body,
            // Follow redirects here, server-side, cookie jar and all — the
            // browser only ever sees the end result. validateStatus: () =>
            // true means axios never throws for a 4xx/5xx target response;
            // the client.js response interceptor decides what to do with it,
            // same as it would for a direct (non-proxied) request.
            maxRedirects: 5,
            validateStatus: () => true
        })

        res.json({
            status: response.status,
            headers: response.headers,
            body: response.data,
            finalUrl: response.request?.res?.responseUrl || url
        })
    } catch (err) {
        res.status(502).json({ error: err.message })
    }
})

// Lets the client explicitly discard a flow's cookies once a login
// attempt is done (successful or not), rather than leaking memory across
// many attempts in a long dev session.
app.delete('/session/:id', (req, res) => {
    jars.delete(req.params.id)
    res.sendStatus(204)
})

app.listen(PORT, () => {
    console.log(`Dev proxy server listening on http://localhost:${PORT}`)
    console.log(`Accepting requests from ${DEV_ORIGIN} only`)
})
