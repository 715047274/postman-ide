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
    </template>
  </Card>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Card, Divider, Button } from 'ant-design-vue'
import CardContainer from './component/cardContainer.vue'
import { login } from '../../api/LoginApi.js'
// A plain .js module (not .json) so template literals work — see
// config/environments.js's `version` variable.
import { environments as seedEnvironments } from './env.js'

// This page only does two things now: owns the env data (load/persist/
// mutate `configs`, and which one is "selected") and provides the page
// shell (the outer Card + a small selected-summary line). Every actual
// UI interaction — the grid, the Add tile, the edit/create modal — lives
// in CardContainer, which just tells this page what happened.

const STORAGE_KEY = 'loginConfigs'
const SELECTED_KEY = 'loginConfigsSelectedName'

function loadConfigs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

const selectedName = ref(localStorage.getItem(SELECTED_KEY) || '')
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
    localStorage.removeItem(SELECTED_KEY)
  }
}

function handleSelect({ name, envData }) {
  selectedName.value = name
  selectedEnvData.value = JSON.parse(JSON.stringify(envData))
  localStorage.setItem(SELECTED_KEY, name)
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
</style>