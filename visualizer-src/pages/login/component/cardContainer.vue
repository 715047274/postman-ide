<template>
  <div class="card-container">
    <Row :gutter="[12, 12]">
      <Col v-for="entry in entries" :key="entry.name" :span="8">
        <EnvCard
            :name="entry.name"
            :env-data="entry.config"
            :selected="entry.name === selectedName"
            @edit="openEdit"
            @delete="(name) => $emit('delete', name)"
            @select="handleSelect"
        />
      </Col>

      <!-- Always last, regardless of how many real cards exist (including
           zero) — the only entry point for adding a new environment. -->
      <Col :span="8">
        <Card hoverable size="small" class="add-card" @click="openCreate">
          <div class="add-card__content">+ Add</div>
        </Card>
      </Col>
    </Row>

    <EnvFormModal
        v-model:open="formVisible"
        :editing-name="editingName"
        :initial-data="editingName ? configs[editingName] : null"
        @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Row, Col, Card } from 'ant-design-vue'
import EnvCard from './EnvCard.vue'
import EnvFormModal from './envModal.vue'

// This component owns the *interaction* (which card is being edited,
// whether the modal is open, what counts as "add" vs "update") but not
// the *data* — configs comes in as a prop, and every actual mutation
// goes back out as an event for Login/index.vue to apply. Same
// props-in/events-out discipline as EnvCard and EnvFormModal, one level
// up: Login doesn't need to know a modal or a grid exists at all, only
// that "add", "update", "delete", and "select" can happen.
const props = defineProps({
  configs: { type: Object, required: true },
  selectedName: { type: String, default: '' }
})

const emit = defineEmits(['add', 'update', 'delete', 'select'])

const entries = computed(() => Object.entries(props.configs).map(([name, config]) => ({ name, config })))

const formVisible = ref(false)
const editingName = ref('')

function openCreate() {
  editingName.value = ''
  formVisible.value = true
}

function openEdit(name) {
  editingName.value = name
  formVisible.value = true
}

// EnvFormModal emits the same { name, data } shape whether creating or
// editing — editingName (captured when the modal was opened) is what
// tells us which semantic event to re-emit as.
function handleSave({ name, data }) {
  if (editingName.value) {
    emit('update', { name, data })
  } else {
    emit('add', { name, data })
  }
}

function handleSelect(name) {
  emit('select', { name, envData: props.configs[name] })
}
</script>

<style scoped>
.add-card {
  cursor: pointer;
  height: 100%;
}
.add-card__content {
  text-align: center;
  color: #999;
  font-size: 20px;
  padding: 12px 0;
}
</style>