<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: number;
  suffix?: string;
}>();
</script>

<template>
  <div class="load-bar">
    <div class="load-bar-head">
      <span>{{ props.label }}</span>
      <strong>{{ Number.isFinite(props.value) ? props.value.toFixed(1) : '0.0' }}{{ props.suffix ?? '%' }}</strong>
    </div>
    <div class="load-track">
      <div class="load-fill" :style="{ width: `${Math.max(0, Math.min(100, props.value))}%` }" />
    </div>
  </div>
</template>
