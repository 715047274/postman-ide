<template>
  <Card class="page login-page" title="Login — Choose Environment">
    <CardContainer
        :configs="configs"
        :selected-name="selectedName"
        @add="handleAdd"
        @update="handleUpdate"
        @delete="handleDelete"
        @select="handleSelect"
    />

    <template v-if="selectedEnvData">
      <Divider>Selected</Divider>
      <p class="selected-summary">
        <strong>{{ selectedName }}</strong> — {{ selectedEnvData.baseUrl }}
      </p>
      <Button type="primary" :loading="loggingIn" @click="handleLogin">Login</Button>
      <p v-if="loginResult" class="login-result">{{ loginResult }}</p>

      <Divider>Generated Pre-request Script</Divider>
      <Alert
          type="warning"
          show-icon
          message="This login call cannot run from inside the visualizer"
          description="axios/fetch from the visualizer is a real browser request, and Dayforce doesn't send Access-Control-Allow-Origin headers — that request will always be CORS-blocked once this is built and pasted into real Postman (the 'Login' button above only works locally, through the dev proxy). pm.sendRequest runs through Postman's own HTTP layer instead, which CORS never applies to. Paste the script below into the request's (or Collection's) Pre-request Script tab to actually log in inside Postman."
          style="margin-bottom: 12px"
      />
      <p class="hint">
        Ports fetchViewState + submitLogin from api/loginApi.js to real pm.sendRequest calls, hardcoded for
        <strong>{{ selectedName }}</strong>. Re-copy after picking a different environment above.
      </p>
      <pre class="code-block">{{ generatedLoginScript }}</pre>
      <Button @click="copyLoginScript">{{ loginScriptCopied ? 'Copied' : 'Copy script' }}</Button>
    </template>
  </Card>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { Card, Divider, Button, Alert } from 'ant-design-vue'
import CardContainer from './component/CardContainer.vue'
import { login } from '../../api/loginApi.js'
// A plain .js module (not .json) so template literals work — see
// config/environments.js's `version` variable.
import { environments as seedEnvironments } from './env.js'
// Wraps localStorage so a throw inside Postman's visualizer sandbox
// (a `data:` URL iframe disables storage entirely) doesn't crash this
// page — see safeStorage.js.
import { safeStorage } from '../../safeStorage.js'

// This page only does two things now: owns the env data (load/persist/
// mutate `configs`, and which one is "selected") and provides the page
// shell (the outer Card + a small selected-summary line). Every actual
// UI interaction — the grid, the Add tile, the edit/create modal — lives
// in CardContainer, which just tells this page what happened.

const STORAGE_KEY = 'loginConfigs'
const SELECTED_KEY = 'loginConfigsSelectedName'

function loadConfigs() {
  try {
    const stored = safeStorage.getItem(STORAGE_KEY)
    // Seed from the bundled config only the very first time — once the
    // user has saved anything, localStorage is the source of truth from
    // then on, so edits/additions persist across reloads instead of
    // being silently reset back to the seed.
    if (stored === null) return JSON.parse(JSON.stringify(seedEnvironments))
    return JSON.parse(stored) || {}
  } catch {
    return {}
  }
}

const configs = reactive(loadConfigs())

function persist() {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

const selectedName = ref(safeStorage.getItem(SELECTED_KEY) || '')
const selectedEnvData = ref(
    configs[selectedName.value] ? JSON.parse(JSON.stringify(configs[selectedName.value])) : null
)

function handleAdd({ name, data }) {
  configs[name] = data
  persist()
}

function handleUpdate({ name, data }) {
  configs[name] = data
  persist()
  // If the env currently selected is the one just edited, refresh the
  // selected snapshot too, so the summary line doesn't show stale data.
  if (selectedName.value === name) {
    selectedEnvData.value = JSON.parse(JSON.stringify(data))
  }
}

function handleDelete(name) {
  delete configs[name]
  persist()
  if (selectedName.value === name) {
    selectedName.value = ''
    selectedEnvData.value = null
    safeStorage.removeItem(SELECTED_KEY)
  }
}

function handleSelect({ name, envData }) {
  selectedName.value = name
  selectedEnvData.value = JSON.parse(JSON.stringify(envData))
  safeStorage.setItem(SELECTED_KEY, name)
}

const loggingIn = ref(false)
const loginResult = ref('')

// Real two-part login (see api/loginApi.js): fetch the ASP.NET
// __VIEWSTATE off the login page, then POST the login form with it.
// Note the CORS caveat documented at the top of loginApi.js — this is a
// faithful rewrite of a flow that worked via pm.sendRequest (no CORS,
// since that's Postman's own HTTP layer, not a browser), but running
// the same requests via axios here, in the visualizer's real browser
// context, may well be blocked by CORS on Dayforce's side. A CORS error
// here doesn't mean this code is wrong — see loginApi.js for the two
// real ways around it (a local proxy, or running this as a Pre-request/
// Test script in actual Postman instead).
async function handleLogin() {
  loggingIn.value = true
  loginResult.value = ''
  try {
    const { baseUrl, clientName, adminName, password } = selectedEnvData.value
    const { response } = await login({ baseUrl, clientName, adminName, password })
    // `response` is now the pm.sendRequest-shaped object sendRequest()
    // hands back (see api/client.js) — .code instead of axios's .status.
    loginResult.value = `Login POST completed — status ${response.code}`
  } catch (err) {
    // Only a genuine network failure lands here now (matching real
    // pm.sendRequest semantics) — a 4xx/5xx from the server comes back
    // as a normal response with response.code set, not a thrown error.
    loginResult.value = `Login failed: ${err.message}`
  } finally {
    loggingIn.value = false
  }
}

// ---------------------------------------------------------------------
// Real Pre-request Script generator — the actual fix for the CORS error
// above, not a workaround for it. Ports fetchViewState + submitLogin
// from api/loginApi.js line-for-line, but calling the real pm.sendRequest
// instead of the sendRequest()/client.js stand-in, since only Postman's
// own HTTP layer is exempt from CORS (see the Alert above). Built the
// same way as Config.vue's generator: an array of plain-quoted lines
// joined with '\n', so the generated code's own backticks/quotes never
// collide with an outer template literal here.
// ---------------------------------------------------------------------
const generatedLoginScript = computed(() => {
  if (!selectedEnvData.value) return ''
  const { baseUrl, clientName, adminName, password } = selectedEnvData.value

  const lines = []
  lines.push('// Auto-generated by the Login page — paste into the request\'s or')
  lines.push('// Collection\'s Pre-request Script tab (NOT the visualizer/Tests tab —')
  lines.push('// pm.sendRequest results never reach the visualizer, and axios/fetch')
  lines.push('// calls made from inside the visualizer itself are real browser requests')
  lines.push('// that Dayforce\'s CORS policy blocks; pm.sendRequest is Postman\'s own')
  lines.push('// HTTP layer and is never subject to CORS.')
  lines.push('//')
  lines.push('// Ported from api/loginApi.js\'s fetchViewState + submitLogin, generated')
  lines.push(`// for "${selectedName.value}".`)
  lines.push('const cheerio = require("cheerio");')
  lines.push('')
  lines.push('const loginConfig = ' + JSON.stringify({ baseUrl, clientName, adminName, password }, null, 2) + ';')
  lines.push('')
  lines.push('const loginPageUrl = `${loginConfig.baseUrl}/MyDayforce.aspx`;')
  lines.push('')
  lines.push('// Step 1: preload the login page for its ASP.NET WebForms postback')
  lines.push('// fields (__VIEWSTATE / __VIEWSTATEGENERATOR) — every subsequent POST')
  lines.push('// to this page must include them.')
  lines.push('const preloadOptions = {')
  lines.push('  url: loginPageUrl,')
  lines.push("  method: 'GET',")
  lines.push('  header: {')
  lines.push("    'Content-Type': 'text/html; charset=utf-8',")
  lines.push("    'Accept-Language': 'en-US,en;q=0.9'")
  lines.push('  }')
  lines.push('};')
  lines.push('')
  lines.push('pm.sendRequest(preloadOptions, (err, resp) => {')
  lines.push('  if (err || !resp || resp.code !== 200) {')
  lines.push("    console.error('Failed to preload login page:', err || (resp && resp.code));")
  lines.push('    return;')
  lines.push('  }')
  lines.push('')
  lines.push('  const $ = cheerio.load(resp.text());')
  lines.push("  const viewState = $('#__VIEWSTATE').attr('value') || '';")
  lines.push("  const viewStateGenerator = $('#__VIEWSTATEGENERATOR').attr('value') || '';")
  lines.push('  pm.environment.set("VIEWSTATE", viewState);')
  lines.push('  pm.environment.set("VIEWSTATEGENERATOR", viewStateGenerator);')
  lines.push('')
  lines.push('  // Step 2: POST the login form. Field names match the page\'s real')
  lines.push('  // <input> names exactly (ASP.NET WebForms\' ctl00$MainContent$...')
  lines.push('  // naming) — most are required even when blank, since the server-side')
  lines.push('  // postback validation checks for their presence, not just the ones')
  lines.push('  // that matter for a successful login.')
  lines.push('  const loginOptions = {')
  lines.push('    url: loginPageUrl,')
  lines.push("    method: 'POST',")
  lines.push('    header: {')
  lines.push("      'Content-Type': 'application/x-www-form-urlencoded'")
  lines.push('    },')
  lines.push('    body: {')
  lines.push("      mode: 'urlencoded',")
  lines.push('      urlencoded: [')
  lines.push("        { key: '__LASTFOCUS', value: '' },")
  lines.push("        { key: '__EVENTTARGET', value: '' },")
  lines.push("        { key: '__EVENTARGUMENT', value: '' },")
  lines.push("        { key: '__VIEWSTATE', value: viewState },")
  lines.push("        { key: '__VIEWSTATEGENERATOR', value: viewStateGenerator },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtCompanyName', value: loginConfig.clientName },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtUserName', value: loginConfig.adminName },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtUserPass', value: loginConfig.password },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$cmdLogin', value: 'Login' },")
  lines.push("        { key: 'ctl00$MainContent$txtResetPasswordUserName', value: '' },")
  lines.push("        { key: 'ctl00$MainContent$txtResetPasswordEmailAddress', value: '' },")
  lines.push("        { key: 'ctl00$MainContent$duoPwd', value: '' },")
  lines.push("        { key: 'ctl00$MainContent$duoQueryString', value: '' },")
  lines.push("        { key: 'ctl00$MainContent$duoUserNameDisplayText', value: '' },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtCompanyId', value: loginConfig.clientName },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtNewUserName', value: loginConfig.adminName },")
  lines.push("        { key: 'ctl00$MainContent$loginUI$txtNewUserPass', value: loginConfig.password }")
  lines.push('      ]')
  lines.push('    }')
  lines.push('  };')
  lines.push('')
  lines.push('  pm.sendRequest(loginOptions, (err2, resp2) => {')
  lines.push('    if (err2 || !resp2) {')
  lines.push("      console.error('Login POST failed:', err2);")
  lines.push('      return;')
  lines.push('    }')
  lines.push("    console.log('Login POST completed — status', resp2.code);")
  lines.push('    pm.environment.set("loginStatusCode", resp2.code);')
  lines.push('')
  lines.push('    // NOTE: pm.sendRequest does not feed Set-Cookie headers from its')
  lines.push('    // response into Postman\'s own cookie jar for this domain — that')
  lines.push('    // only happens automatically for the collection\'s own real')
  lines.push('    // requests, not ones made via pm.sendRequest from a script. If a')
  lines.push('    // later request in this collection needs the session cookie this')
  lines.push('    // login establishes, either run this POST as the collection\'s own')
  lines.push('    // real request instead of via pm.sendRequest here, or read')
  lines.push('    // resp2.headers.get("set-cookie") and set it into pm.cookies')
  lines.push('    // yourself (see Postman\'s pm.cookies.jar() docs).')
  lines.push('  });')
  lines.push('});')

  return lines.join('\n')
})

const loginScriptCopied = ref(false)
async function copyLoginScript() {
  await navigator.clipboard.writeText(generatedLoginScript.value)
  loginScriptCopied.value = true
  setTimeout(() => (loginScriptCopied.value = false), 1500)
}
</script>

<style scoped>
.selected-summary {
  font-size: 13px;
  color: #444;
  margin-bottom: 8px;
}
.login-result {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}
.hint {
  font-size: 12px;
  color: #666;
}
.code-block {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 11.5px;
  line-height: 1.5;
  max-height: 320px;
  overflow: auto;
  text-align: left;
  white-space: pre;
}
</style>