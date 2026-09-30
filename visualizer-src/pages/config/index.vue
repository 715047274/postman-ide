<template>
  <Card class="page config-page" title="Environment Configs">
    <Alert
        type="warning"
        show-icon
        message="This page cannot set Postman environment variables directly"
        description="Postman's visualizer only exposes pm.getData() — pm.environment.set() silently does nothing here, a long-standing platform limitation (see postmanlabs/postman-app-support#8341). Instead, this generates a script for the Pre-request Script tab, which has full pm.environment access."
        style="margin-bottom: 16px"
    />

    <Space direction="vertical" style="width: 100%" size="middle">
      <Button type="primary" @click="openCreate">+ New config</Button>

      <Empty v-if="!configEntries.length" description="No configs yet — add one above" />

      <Row v-else :gutter="[12, 12]">
        <Col v-for="entry in configEntries" :key="entry.name" :span="8">
          <Card
              hoverable
              size="small"
              :class="['env-card', { 'env-card--active': entry.name === activeName }]"
              @click="select(entry.name)"
          >
            <template #title>{{ entry.name }}</template>
            <template #extra>
              <Tag v-if="entry.name === activeName" color="green">Active</Tag>
            </template>
            <p class="env-card__url">{{ entry.config.baseUrl }}</p>
            <Space size="small">
              <Button size="small" @click.stop="openEdit(entry.name)">Edit</Button>
              <Button size="small" danger @click.stop="remove(entry.name)">Delete</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <div v-if="configEntries.length">
        <Divider>Generated Pre-request Script</Divider>
        <Space direction="vertical" size="small" style="width: 100%; margin-bottom: 10px">
          <Space>
            <Switch v-model:checked="includeCssInjection" size="small" />
            <span>Inject Bulma CSS variable (matches your existing script)</span>
          </Space>
          <Space>
            <Switch v-model:checked="includeViewStatePreload" size="small" />
            <span>Also fetch ASP.NET __VIEWSTATE via a preload request (cheerio)</span>
          </Space>
        </Space>
        <p class="hint">
          Paste this once into the request's (or Collection's) <strong>Pre-request Script</strong> tab. To switch
          which config is active afterward, edit the <code>activeInstanceName</code> variable in Postman's
          Environment editor — no need to re-paste this script each time.
        </p>
        <pre class="code-block">{{ generatedScript }}</pre>
        <Button @click="copyScript">{{ copied ? 'Copied' : 'Copy script' }}</Button>
      </div>
    </Space>

    <Modal
        v-model:open="formVisible"
        :title="editingName ? `Edit ${editingName}` : 'New config'"
        width="640px"
        @ok="save"
    >
      <Form layout="vertical">
        <FormItem label="Instance name (object key)">
          <Input v-model:value="form.name" :disabled="!!editingName" placeholder="autotest12_local_sp" />
        </FormItem>
        <FormItem label="Base URL"><Input v-model:value="form.baseUrl" /></FormItem>
        <FormItem label="UI URL"><Input v-model:value="form.uiUrl" /></FormItem>
        <FormItem label="Test Service URL"><Input v-model:value="form.testSvcUrl" /></FormItem>
        <FormItem label="Client Name"><Input v-model:value="form.clientName" /></FormItem>
        <FormItem label="Admin Name"><Input v-model:value="form.adminName" /></FormItem>
        <FormItem label="Password"><Input v-model:value="form.password" /></FormItem>
        <FormItem label="Remote Frontend URL"><Input v-model:value="form.remoteFrontendUrl" /></FormItem>

        <Divider>Gateway Context</Divider>
        <FormItem label="Control DB Key"><Input v-model:value="form.gatewayContext.controlDbKey" /></FormItem>
        <FormItem label="Info Service URL"><Input v-model:value="form.gatewayContext.infoServiceUrl" /></FormItem>
        <FormItem label="Payroll Service Base URL">
          <Input v-model:value="form.gatewayContext.payrollServiceBaseUrl" />
        </FormItem>
        <FormItem label="Payroll Versioned Service Base URL">
          <Input v-model:value="form.gatewayContext.payrollVersionedServiceBaseUrl" />
        </FormItem>
        <FormItem label="Client ID"><InputNumber v-model:value="form.gatewayContext.clientId" style="width: 100%" /></FormItem>
        <FormItem label="Wallet Gateway URL"><Input v-model:value="form.gatewayContext.walletGatewayUrl" /></FormItem>
        <FormItem label="DFID URL Key"><Input v-model:value="form.gatewayContext.dfidUrlKey" /></FormItem>
        <FormItem label="DFID Admin URL Key"><Input v-model:value="form.gatewayContext.dfidAdminUrlKey" /></FormItem>
        <FormItem label="Current Role ID">
          <InputNumber v-model:value="form.gatewayContext.currentRoleId" style="width: 100%" />
        </FormItem>
        <FormItem label="Client Namespace"><Input v-model:value="form.gatewayContext.clientNamespace" /></FormItem>
      </Form>
    </Modal>
  </Card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
// Wraps localStorage so a throw inside Postman's visualizer sandbox
// (a `data:` URL iframe disables storage entirely) doesn't crash this
// page — see safeStorage.js.
import { safeStorage } from '../../safeStorage.js'
import {
  Card,
  Space,
  Button,
  Row,
  Col,
  Tag,
  Empty,
  Switch,
  Divider,
  Modal,
  Form,
  Input,
  InputNumber,
  Alert,
  message
} from 'ant-design-vue'

const FormItem = Form.Item

const STORAGE_KEY = 'envConfigs'
const ACTIVE_KEY = 'envConfigsActiveName'

function loadConfigs() {
  try {
    return JSON.parse(safeStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

// `reactive`, not `ref` — configs is a dictionary we mutate in place
// (add/edit/delete keys) rather than replace wholesale.
const configs = reactive(loadConfigs())
const activeName = ref(safeStorage.getItem(ACTIVE_KEY) || '')

function persist() {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

const configEntries = computed(() => Object.entries(configs).map(([name, config]) => ({ name, config })))

function select(name) {
  activeName.value = name
  safeStorage.setItem(ACTIVE_KEY, name)
}

function remove(name) {
  delete configs[name]
  persist()
  if (activeName.value === name) {
    activeName.value = ''
    safeStorage.removeItem(ACTIVE_KEY)
  }
}

function blankForm() {
  return {
    name: '',
    baseUrl: '',
    uiUrl: '',
    testSvcUrl: '',
    clientName: '',
    adminName: '',
    password: '',
    remoteFrontendUrl: '',
    gatewayContext: {
      controlDbKey: '',
      infoServiceUrl: '',
      payrollServiceBaseUrl: '',
      payrollVersionedServiceBaseUrl: '',
      clientId: null,
      walletGatewayUrl: '',
      dfidUrlKey: '',
      dfidAdminUrlKey: '',
      currentRoleId: null,
      clientNamespace: ''
    }
  }
}

const formVisible = ref(false)
const editingName = ref('')
const form = reactive(blankForm())

function openCreate() {
  editingName.value = ''
  Object.assign(form, blankForm())
  formVisible.value = true
}

function openEdit(name) {
  editingName.value = name
  Object.assign(form, blankForm(), JSON.parse(JSON.stringify(configs[name])), { name })
  formVisible.value = true
}

function save() {
  if (!form.name) {
    message.error('Instance name is required')
    return
  }
  const { name, ...rest } = form
  configs[name] = JSON.parse(JSON.stringify(rest))
  persist()
  if (!activeName.value) select(name)
  formVisible.value = false
}

const includeCssInjection = ref(true)
const includeViewStatePreload = ref(true)

// Built as an array of plain lines, not one big template literal — the
// generated code itself uses backticks (the css injection line, the
// preloadUrl line), and writing those directly inside an outer template
// literal here would need the same nested-backtick escaping we handled
// by hand in the standalone Vue h()-based script earlier. Plain
// single-quoted strings joined with '\n' sidestep that entirely.
const generatedScript = computed(() => {
  if (configEntries.value.length === 0) return ''
  const fallback = activeName.value || configEntries.value[0].name

  const lines = []
  lines.push("// Auto-generated by the Config page — paste into the request's or")
  lines.push("// Collection's Pre-request Script tab (NOT the visualizer/Tests tab —")
  lines.push("// pm.environment isn't reachable from inside the visualizer).")
  lines.push('// To switch environments afterward, edit "activeInstanceName" in')
  lines.push("// Postman's Environment editor; no need to re-paste this script.")
  lines.push(`const environments = ${JSON.stringify(configs, null, 2)};`)
  lines.push('')
  lines.push(`const activeInstanceName = pm.environment.get("activeInstanceName") || ${JSON.stringify(fallback)};`)
  lines.push('const instance = environments[activeInstanceName];')
  lines.push('')
  lines.push('if (!instance) {')
  lines.push('  console.warn(\'No config named "\' + activeInstanceName + \'" in the environments object above.\');')
  lines.push('} else {')

  if (includeCssInjection.value) {
    lines.push('  // css for the bulma')
    lines.push('  let css = `<link href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css" rel="stylesheet"/>`;')
    lines.push('  pm.environment.set("css", css);')
    lines.push('')
  }

  lines.push('  // setup environment variables')
  lines.push('  pm.environment.set("baseUrl", instance.baseUrl)')
  lines.push('  pm.environment.set("uiUrl", instance.uiUrl)')
  lines.push('  pm.environment.set("clientInstance", instance.clientName)')
  lines.push('  pm.environment.set("adminName", instance.adminName)')
  lines.push('  pm.environment.set("adminPass", instance.password)')
  lines.push('  pm.environment.set("testSvcUrl", instance.testSvcUrl)')
  lines.push('  // frontend gateway')
  lines.push('  pm.environment.set("remoteFrontendUrl", instance.remoteFrontendUrl)')
  lines.push('  pm.environment.set("gatewayContext", JSON.stringify(instance.gatewayContext))')

  if (includeViewStatePreload.value) {
    lines.push('')
    lines.push('  // Requires "cheerio" to be enabled among this request\'s allowed')
    lines.push("  // external libraries — Postman's sandbox exposes a curated set of npm")
    lines.push('  // packages this way (cheerio included), which is separate from — and')
    lines.push("  // much narrower than — Node's general require(), which is blocked")
    lines.push('  // entirely in Postman scripts (no fs, no arbitrary npm install).')
    lines.push('  const cheerio = require("cheerio");')
    lines.push('')
    lines.push('  let preloadUrl = `${pm.environment.get("baseUrl")}/MyDayforce.aspx`;')
    lines.push('  let preloadOptions = {')
    lines.push('    url: preloadUrl,')
    lines.push("    method: 'GET',")
    lines.push('    header: {')
    lines.push("      'Content-Type': 'text/html; charset=utf-8',")
    lines.push("      'Accept-Language': 'en-US,en;q=0.9'")
    lines.push('    }')
    lines.push('  };')
    lines.push('')
    lines.push('  pm.sendRequest(preloadOptions, (err, resp) => {')
    lines.push('    if (resp && resp.code == 200) {')
    lines.push('      const $ = cheerio.load(resp.text());')
    lines.push('      pm.environment.set("VIEWSTATE", $(\'#__VIEWSTATE\').attr(\'value\'));')
    lines.push('      pm.environment.set("VIEWSTATEGENERATOR", $(\'#__VIEWSTATEGENERATOR\').attr(\'value\'));')
    lines.push('    }')
    lines.push('  });')
  }

  lines.push('}')
  lines.push('')

  return lines.join('\n')
})

const copied = ref(false)
async function copyScript() {
  await navigator.clipboard.writeText(generatedScript.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<style scoped>
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
.env-card {
  cursor: pointer;
}
.env-card--active {
  border-color: #52c41a;
  box-shadow: 0 0 0 1px #52c41a;
}
.env-card__url {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}
</style>