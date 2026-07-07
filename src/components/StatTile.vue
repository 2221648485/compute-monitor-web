<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  detail?: string;
}>();
</script>

<template>
  <article class="stat-tile">
    <div class="corner-mark" />
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="detail">{{ detail }}</small>
  </article>
</template>
