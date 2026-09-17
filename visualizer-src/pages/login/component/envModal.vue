<template>
  <Modal
      :open="open"
      :title="editingName ? `Edit ${editingName}` : 'New environment'"
      width="640px"
      @update:open="$emit('update:open', $event)"
      @ok="handleOk"
  >
    <Form layout="vertical">
      <FormItem label="Instance name (object key)">
        <Input v-model:value="testEnv.name" :disabled="!!editingName" placeholder="qa10005" />
      </FormItem>

      <FormItem v-for="field in topLevelFields" :key="field.key" :label="field.label">
        <Input :value="getPath(testEnv, field.key)" @update:value="setPath(testEnv, field.key, $event)" />
      </FormItem>

      <Divider>Gateway Context</Divider>

      <FormItem v-for="field in gatewayFields" :key="field.key" :label="field.label">
        <component
            :is="field.type === 'number' ? InputNumber : Input"
            :value="getPath(testEnv, field.key)"
            style="width: 100%"
            @update:value="setPath(testEnv, field.key, $event)"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Modal, Form, Input, InputNumber, Divider, message } from 'ant-design-vue'

const FormItem = Form.Item

const props = defineProps({
  open: { type: Boolean, default: false },
  editingName: { type: String, default: '' },
  // The existing env's data when editing, or null when creating new.
  initialData: { type: Object, default: null }
})

const emit = defineEmits(['update:open', 'save'])

// The schema IS the form — each entry renders exactly one FormItem, so
// adding/removing/relabeling a field means editing one line here, not
// hunting down a matching FormItem+Input pair in the template. `key` can
// be a dotted path ("gatewayContext.clientId") since testEnv has nested
// objects; getPath/setPath below handle that generically.
const topLevelFields = [
  { key: 'baseUrl', label: 'Base URL' },
  { key: 'uiUrl', label: 'UI URL' },
  { key: 'testSvcUrl', label: 'Test Service URL' },
  { key: 'clientName', label: 'Client Name' },
  { key: 'adminName', label: 'Admin Name' },
  { key: 'password', label: 'Password' },
  { key: 'remoteFrontendUrl', label: 'Remote Frontend URL' }
]

const gatewayFields = [
  { key: 'gatewayContext.controlDbKey', label: 'Control DB Key' },
  { key: 'gatewayContext.infoServiceUrl', label: 'Info Service URL' },
  { key: 'gatewayContext.payrollServiceBaseUrl', label: 'Payroll Service Base URL' },
  { key: 'gatewayContext.payrollVersionedServiceBaseUrl', label: 'Payroll Versioned Service Base URL' },
  { key: 'gatewayContext.clientId', label: 'Client ID', type: 'number' },
  { key: 'gatewayContext.walletGatewayUrl', label: 'Wallet Gateway URL' },
  { key: 'gatewayContext.dfidUrlKey', label: 'DFID URL Key' },
  { key: 'gatewayContext.dfidAdminUrlKey', label: 'DFID Admin URL Key' }
]

// v-model:value doesn't support a dynamic/dotted path on its left side
// directly ("v-model:value="testEnv[field.key]"" wouldn't reach into
// nested objects) — :value + @update:value is exactly what v-model:value
// desugars to anyway, just written out so the path can be computed per
// field at render time instead of hardcoded per FormItem.
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
function setPath(obj, path, value) {
  const keys = path.split('.')
  const last = keys.pop()
  const target = keys.reduce((o, k) => o[k], obj)
  target[last] = value
}

function blankTestEnv() {
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
      dfidAdminUrlKey: ''
    }
  }
}

// testEnv holds every field the form edits, flat and nested alike — the
// name asked for specifically, replacing what was called `form` before.
const testEnv = reactive(blankTestEnv())

// Reset (create) or populate (edit) every time the modal opens — not
// once at component creation, since this same modal instance gets
// reused for every Add/Edit click rather than recreated each time.
watch(
    () => props.open,
    (isOpen) => {
      if (!isOpen) return
      Object.assign(testEnv, blankTestEnv())
      if (props.editingName && props.initialData) {
        // Deep-clone so editing the form can never mutate the parent's
        // actual stored config until `save` is explicitly emitted.
        Object.assign(testEnv, JSON.parse(JSON.stringify(props.initialData)), { name: props.editingName })
      }
    }
)

function handleOk() {
  if (!testEnv.name) {
    message.error('Instance name is required')
    return
  }
  const { name, ...data } = testEnv
  emit('save', { name, data: JSON.parse(JSON.stringify(data)) })
  emit('update:open', false)
}
</script>