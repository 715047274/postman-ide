<template>
  <Card
      hoverable
      size="small"
      class="env-card"
      :class="{ 'env-card--selected': selected }"
      @click="$emit('select', name)"
  >
    <template #title>
      <div class="card-title">
        <span class="card-title__name">{{ name }}</span>
        <div class="card-actions">
          <Button size="small" type="text" @click.stop="$emit('edit', name)">
            <EditOutlined />
          </Button>
          <Button size="small" type="text" danger @click.stop="$emit('delete', name)">
            <DeleteOutlined />
          </Button>
        </div>
      </div>
    </template>
    <p class="env-card__url">{{ envData.baseUrl }}</p>
    <p class="env-card__url">{{ envData.testSvcUrl }}</p>
    <p class="env-card__url">{{ envData.clientName }}</p>
    <p class="env-card__url">{{ envData.adminName }}</p>
    <p class="env-card__url">{{ envData.password }}</p>
  </Card>
</template>

<script setup>
import { Card, Button } from 'ant-design-vue'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
// Deliberately minimal — this component only knows how to display one
// environment and ask its parent to edit/delete it. It doesn't own the
// data, doesn't know about localStorage, doesn't know what "edit" or
// "delete" actually do — that's Login/index.vue's job. Props in, events
// out, nothing else.
defineProps({
  name: { type: String, required: true },
  envData: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete', 'select'])
</script>

<style scoped>
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-title__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.env-card:hover .card-actions {
  opacity: 1;
}
.env-card__url {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
</style>
