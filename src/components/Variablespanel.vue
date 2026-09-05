<template>
  <div class="panel">
    <div class="panel__header">
      <span>Variables (pm mock inspector)</span>
      <button class="ghost-btn" @click="refresh">Refresh</button>
    </div>
    <div class="variables-panel__body">
      <div v-for="scope in scopes" :key="scope.name" class="variables-panel__scope">
        <h4>{{ scope.name }}</h4>
        <table v-if="Object.keys(scope.values).length">
          <tr v-for="(value, key) in scope.values" :key="key">
            <td class="variables-panel__key">{{ key }}</td>
            <td class="variables-panel__value">{{ value }}</td>
          </tr>
        </table>
        <p v-else class="variables-panel__empty">(empty)</p>
      </div>
    </div>
    <div class="panel__footnote">
      Not reactive — these scopes are plain objects in <code>pmMock.js</code>, not Vue refs, since real Postman's
      variable scopes aren't reactive either. Hit Refresh after triggering a <code>pm.environment.set(...)</code>
      call elsewhere (e.g. Page 1's "Set testUrl" button) to see it here.
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const scopes = ref([])

function refresh() {
  if (typeof window.pm === 'undefined') {
    scopes.value = []
    return
  }
  scopes.value = [
    { name: 'environment', values: window.pm.environment.toObject() },
    { name: 'collectionVariables', values: window.pm.collectionVariables.toObject() },
    { name: 'globals', values: window.pm.globals.toObject() }
  ]
}

// Same import-order reasoning as RequestBar's resolvedUrl — window.pm is
// already installed by the time this component's setup() runs.
refresh()
</script>

<style scoped>
.variables-panel__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.variables-panel__scope h4 {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}
.variables-panel__scope table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 12px;
}
.variables-panel__key {
  color: var(--accent);
  padding: 2px 10px 2px 0;
  white-space: nowrap;
  vertical-align: top;
}
.variables-panel__value {
  color: var(--text);
  word-break: break-all;
}
.variables-panel__empty {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}
</style>