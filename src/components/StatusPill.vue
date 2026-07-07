<script setup lang="ts">
const props = defineProps<{
  value?: string | number | boolean;
}>();

function tone(value: unknown) {
  const text = String(value ?? '').toLowerCase();
  if (['ready', 'running', 'active', 'enabled', 'true', 'success', 'ok', '1'].includes(text)) return 'ok';
  if (['pending', 'warning', 'degraded', 'paused'].includes(text)) return 'warn';
  if (['failed', 'notready', 'error', 'disabled', 'false', '0'].includes(text)) return 'bad';
  return 'neutral';
}
</script>

<template>
  <span class="status-pill" :class="tone(props.value)">
    <span class="status-dot" />
    {{ props.value ?? '未知' }}
  </span>
</template>
