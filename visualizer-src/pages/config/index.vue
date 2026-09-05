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

      <List bordered :dataSource="configEntries" :locale="{ emptyText: 'No configs yet — add one above' }">
        <template #renderItem="{ item }">
          <ListItem>
            <template #actions>
              <a @click="select(item.name)">{{ item.name === activeName ? 'Selected' : 'Select' }}</a>
              <a @click="openEdit(item.name)">Edit</a>
              <a @click="remove(item.name)">Delete</a>
            </template>
            <ListItemMeta :title="item.name" :description="item.config.baseUrl" />
          </ListItem>
        </template>
      </List>

      <div v-if="configEntries.length">
        <Divider>Generated Pre-request Script</Divider>
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
import { Card, Space, Button, List, Divider, Modal, Form, Input, InputNumber, Alert, message } from 'ant-design-vue'

const ListItem = List.Item
const ListItemMeta = List.Item.Meta
const FormItem = Form.Item

const STORAGE_KEY = 'envConfigs'
const ACTIVE_KEY = 'envConfigsActiveName'

function loadConfigs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

// `reactive`, not `ref` — configs is a dictionary we mutate in place
// (add/edit/delete keys) rather than replace wholesale.
const configs = reactive(loadConfigs())
const activeName = ref(localStorage.getItem(ACTIVE_KEY) || '')

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

const configEntries = computed(() => Object.entries(configs).map(([name, config]) => ({ name, config })))

function select(name) {
  activeName.value = name
  localStorage.setItem(ACTIVE_KEY, name)
}

function remove(name) {
  delete configs[name]
  persist()
  if (activeName.value === name) {
    activeName.value = ''
    localStorage.removeItem(ACTIVE_KEY)
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

// The whole configs object is embedded in the generated script (not just
// the currently-selected one), keyed by `activeInstanceName` — a real
// Postman environment variable you edit directly in Postman's own
// Environment editor to switch instances, without ever re-pasting this
// script. That variable lives in pm.environment, which this script CAN
// read/write, because it's designed to run in the Pre-request Script tab
// — a completely different execution context from the visualizer iframe
// this page is rendered inside.
const generatedScript = computed(() => {
  if (configEntries.value.length === 0) return ''
  const fallback = activeName.value || configEntries.value[0].name

  return `// Auto-generated by the Config page — paste into the request's or
// Collection's Pre-request Script tab (NOT the visualizer/Tests tab —
// pm.environment isn't reachable from inside the visualizer).
// To switch environments afterward, edit "activeInstanceName" in
// Postman's Environment editor; no need to re-paste this script.
const environments = ${JSON.stringify(configs, null, 2)};

const activeInstanceName = pm.environment.get("activeInstanceName") || ${JSON.stringify(fallback)};
const instance = environments[activeInstanceName];

if (!instance) {
  console.warn('No config named "' + activeInstanceName + '" in the environments object above.');
} else {
  // setup environment variables
  pm.environment.set("baseUrl", instance.baseUrl)
  pm.environment.set("uiUrl", instance.uiUrl)
  pm.environment.set("clientInstance", instance.clientName)
  pm.environment.set("adminName", instance.adminName)
  pm.environment.set("adminPass", instance.password)
  pm.environment.set("testSvcUrl", instance.testSvcUrl)
  // frontend gateway
  pm.environment.set("remoteFrontendUrl", instance.remoteFrontendUrl)
  pm.environment.set("gatewayContext", JSON.stringify(instance.gatewayContext))
}
`
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
</style>
