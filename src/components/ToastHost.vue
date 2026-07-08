<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

const toast = useToast();
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="true">
    <div
      v-for="item in toast.items"
      :key="item.id"
      class="toast-item"
      :class="[item.tone, { leaving: item.leaving }]"
    >
      <span>{{ item.message }}</span>
      <button type="button" title="关闭" @click="toast.remove(item.id)">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>
