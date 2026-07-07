<script setup lang="ts" generic="T extends Record<string, unknown>">
defineProps<{
  rows: T[];
  columns: Array<{ key: keyof T | string; label: string; format?: (row: T) => string | number }>;
}>();
</script>

<template>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="String(column.key)">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="String(row.id ?? row.name ?? row.nodeName ?? index)">
          <td v-for="column in columns" :key="String(column.key)">
            {{ column.format ? column.format(row) : row[column.key as keyof T] ?? '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
