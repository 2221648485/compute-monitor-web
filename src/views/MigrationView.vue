<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { monitorApi } from '../api/monitor';
import type { Cluster, MigrationPlan } from '../api/types';
import { useToast } from '../composables/useToast';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusPill from '../components/StatusPill.vue';

defineProps<{
  cluster?: Cluster;
}>();

const toast = useToast();
const plans = ref<MigrationPlan[]>([]);
const tasks = ref<MigrationPlan[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const [planPage, taskPage] = await Promise.all([
      monitorApi.migrationPlans({ page: 1, size: 50 }),
      monitorApi.migrationTasks({ page: 1, size: 50 }),
    ]);
    plans.value = planPage.items || [];
    tasks.value = taskPage.items || [];
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '迁移数据加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="view-stack">
    <div v-if="loading" class="loading-panel">正在加载迁移计划...</div>

    <div class="panel-grid two">
      <article class="panel">
        <div class="panel-head">
          <span class="eyebrow">Migration Plans</span>
          <h2>迁移计划</h2>
        </div>
        <DataTable
          v-if="plans.length"
          :rows="plans as Record<string, unknown>[]"
          :columns="[
            { key: 'planId', label: '计划 ID' },
            { key: 'name', label: '名称' },
            { key: 'status', label: 'Status' },
            { key: 'sourceClusterId', label: '源集群' },
            { key: 'targetClusterId', label: '目标集群' },
          ]"
        />
        <EmptyState v-else title="暂无迁移计划" message="后端已具备迁移计划接口，此处保留为轻量任务台。" />
      </article>

      <article class="panel">
        <div class="panel-head">
          <span class="eyebrow">Migration Tasks</span>
          <h2>任务状态</h2>
        </div>
        <div v-if="tasks.length" class="compact-list">
          <div v-for="task in tasks" :key="String(task.taskId ?? task.id ?? task.planId)" class="list-row">
            <strong>{{ task.name || task.taskId || task.id }}</strong>
            <StatusPill :value="String(task.status ?? 'unknown')" />
          </div>
        </div>
        <EmptyState v-else title="暂无迁移任务" message="执行接口可后续接入确认弹窗和进度回传。" />
      </article>
    </div>
  </section>
</template>
