<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';

defineProps<{
  title: string;
  message?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <AlertCircle :size="18" />
    <strong>{{ title }}</strong>
    <span v-if="message">{{ message }}</span>
  </div>
</template>
