<template>
  <div class="panel">
    <div class="panel__header">
      <span>Request</span>
      <span v-if="status !== null" class="status-pill" :class="status === 'error' ? 'status-pill--error' : 'status-pill--ok'">
        {{ status === 'error' ? 'Error' : `Status ${status}` }}
      </span>
    </div>
    <div class="request-bar">
      <select v-model="method" class="request-bar__method">
        <option v-for="m in METHODS" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        v-model="url"
        class="request-bar__url"
        placeholder="https://api.example.com/resource"
        spellcheck="false"
      />
      <button class="request-bar__send" :disabled="loading" @click="$emit('send')">
        {{ loading ? 'Sending…' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

defineProps({
  loading: Boolean,
  status: { type: [Number, String], default: null }
})
defineEmits(['send'])

const method = defineModel('method')
const url = defineModel('url')
</script>
