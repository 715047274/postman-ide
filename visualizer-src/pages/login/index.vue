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
import { Card, Divider } from 'ant-design-vue'
import CardContainer from './component/cardContainer.vue'
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

// Stand-in for whatever the real login flow needs — your original
// script's actual login used a preload request (cheerio, __VIEWSTATE)
// via pm.sendRequest, which only works in a Pre-request/Test script, not
// here in the visualizer (same pm.environment constraint covered
// earlier). This proves out the loading-state UX with a real outbound
// call instead, same axios pattern as Page 1 Detail's POC. Swap the body
// of this function for whatever "login" should actually mean once
// that's pinned down — the loading/error wiring around it stays the same.
async function handleLogin() {
  loggingIn.value = true
  loginResult.value = ''
  try {
    const res = await axios.get(selectedEnvData.value.baseUrl, { timeout: 8000 })
    loginResult.value = `Reached ${selectedEnvData.value.baseUrl} — status ${res.status}`
  } catch (err) {
    loginResult.value = `Login check failed: ${err.message}`
  } finally {
    loggingIn.value = false
  }
}
</script>

<style scoped>
.selected-summary {
  font-size: 13px;
  color: #444;
}
</style>