<script setup lang="ts">
import type { Cluster } from '../api/types';

defineProps<{
  clusters: Cluster[];
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <label class="cluster-select">
    <span>集群</span>
    <select :value="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
        {{ cluster.name || cluster.id }}
      </option>
    </select>
  </label>
</template>
