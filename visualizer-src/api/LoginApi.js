// cheerio's package no longer ships a default export (it's an ESM
// package with only named exports), so `import cheerio from 'cheerio'`
// fails under Vite's dependency pre-bundling with exactly the error you
// saw ("does not provide an export named 'default'"). Import the `load`
// function by name instead — that's the only part of cheerio used here.
import { load } from 'cheerio'
import { sendRequest } from './client.js'

// ---------------------------------------------------------------------
// IMPORTANT — CORS: the original script used pm.sendRequest, which goes
// through Postman's own HTTP layer, not a browser — so it was NEVER
// subject to CORS. This file now calls `sendRequest` from client.js,
// which is a dev-mode stand-in for pm.sendRequest: same options shape
// in ({url, method, header, body: {mode, urlencoded|raw}}), same
// response shape out (err, resp) with resp.code/.headers.get()/.text()/
// .json(). Under the hood it still runs on axios, routed through the
// dev proxy server (see client.js / dev-proxy-server.mjs) so it works
// locally despite Dayforce not sending CORS headers for cross-origin
// XHR. The point of matching pm.sendRequest's shape here: porting this
// logic into a real Postman Pre-request/Test script later should mean
// swapping the `sendRequest` import for the real `pm.sendRequest` (and
// turning each `await callAsync(...)` below back into a plain
// `pm.sendRequest(options, callback)` call) — not rewriting the flow.
// ---------------------------------------------------------------------

// Promise-wraps sendRequest's callback so the rest of this file can stay
// readable with async/await, without changing sendRequest's own
// pm.sendRequest-compatible (options, callback) signature.
function callAsync(options) {
    return new Promise((resolve, reject) => {
        sendRequest(options, (err, resp) => {
            if (err) reject(err)
            else resolve(resp)
        })
    })
}

// Step 1: GET the login page, extract the ASP.NET WebForms postback
// fields every subsequent POST to this page must include. Equivalent to
// the original script's preload request + cheerio.load(resp.text()).
export async function fetchViewState(baseUrl) {
    const options = {
        url: `${baseUrl}/MyDayforce.aspx`,
        method: 'GET',
        header: { 'Content-Type': 'text/html; charset=utf-8' }
    }
    const resp = await callAsync(options)
    const $ = load(resp.text())
    return {
        viewState: $('#__VIEWSTATE').attr('value') || '',
        viewStateGenerator: $('#__VIEWSTATEGENERATOR').attr('value') || ''
    }
}

// Step 2: POST the login form itself. Field names match the page's real
// <input> names exactly (ASP.NET WebForms' ctl00$MainContent$... naming
// convention) — most are required even when blank, since the server-side
// postback validation checks for their presence, not just the ones that
// matter for a successful login.
export async function submitLogin({ baseUrl, clientName, adminName, password, viewState, viewStateGenerator }) {
    const options = {
        url: `${baseUrl}/MyDayforce.aspx`,
        method: 'POST',
        body: {
            mode: 'urlencoded',
            urlencoded: [
                { key: '__LASTFOCUS', value: '' },
                { key: '__EVENTTARGET', value: '' },
                { key: '__EVENTARGUMENT', value: '' },
                { key: '__VIEWSTATE', value: viewState },
                { key: '__VIEWSTATEGENERATOR', value: viewStateGenerator },
                { key: 'ctl00$MainContent$loginUI$txtCompanyName', value: clientName },
                { key: 'ctl00$MainContent$loginUI$txtUserName', value: adminName },
                { key: 'ctl00$MainContent$loginUI$txtUserPass', value: password },
                { key: 'ctl00$MainContent$loginUI$cmdLogin', value: 'Login' },
                { key: 'ctl00$MainContent$txtResetPasswordUserName', value: '' },
                { key: 'ctl00$MainContent$txtResetPasswordEmailAddress', value: '' },
                { key: 'ctl00$MainContent$duoPwd', value: '' },
                { key: 'ctl00$MainContent$duoQueryString', value: '' },
                { key: 'ctl00$MainContent$duoUserNameDisplayText', value: '' },
                { key: 'ctl00$MainContent$loginUI$txtCompanyId', value: clientName },
                { key: 'ctl00$MainContent$loginUI$txtNewUserName', value: adminName },
                { key: 'ctl00$MainContent$loginUI$txtNewUserPass', value: password }
            ]
        }
    }
    return callAsync(options)
}

// Runs both steps in order. This is the direct-form-login path only —
// your handleLogin reference shows a second, different path for
// environments that redirect through an OIDC provider (qa1086, hspr,
// stui, spui in that script), which is a separate authorization-code
// exchange flow, not implemented here. This covers the simpler direct
// login the rewrite request specifically asked for; the OIDC path would
// need its own function (fetchOidcRedirect / exchangeCodeForToken or
// similar) if you want that ported too — and it, too, can now be written
// straight against `sendRequest`/`callAsync` the same way.
export async function login({ baseUrl, clientName, adminName, password }) {
    const { viewState, viewStateGenerator } = await fetchViewState(baseUrl)
    const response = await submitLogin({ baseUrl, clientName, adminName, password, viewState, viewStateGenerator })
    return { response, viewState, viewStateGenerator }
}