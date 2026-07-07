<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Server } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { Deployment, WorkloadPod } from '../api/types';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusPill from '../components/StatusPill.vue';

const props = defineProps<{
  clusterId: string;
}>();

const emit = defineEmits<{
  'open-clusters': [];
}>();

const pods = ref<WorkloadPod[]>([]);
const deployments = ref<Deployment[]>([]);
const active = ref<'pods' | 'deployments'>('pods');
const loading = ref(false);
const error = ref('');

async function load() {
  pods.value = [];
  deployments.value = [];
  if (!props.clusterId) return;
  loading.value = true;
  error.value = '';
  try {
    const [podPage, deploymentPage] = await Promise.all([
      monitorApi.pods(props.clusterId, { page: 1, size: 100 }),
      monitorApi.deployments(props.clusterId, { page: 1, size: 100 }),
    ]);
    pods.value = podPage.items || [];
    deployments.value = deploymentPage.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载工作负载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.clusterId, load);
</script>

<template>
  <section class="view-stack">
    <div v-if="!clusterId" class="empty-action">
      <EmptyState title="未选择集群" message="请先新增或选择集群，并同步资源后再查看工作负载。" />
      <button class="primary-button" type="button" @click="emit('open-clusters')">
        <Server :size="16" />
        打开集群纳管
      </button>
    </div>
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading-panel">正在加载工作负载...</div>

    <article v-if="clusterId" class="panel">
      <div class="panel-head with-tabs">
        <div>
          <span class="eyebrow">Workloads</span>
          <h2>Pod 与 Deployment</h2>
        </div>
        <div class="segmented">
          <button :class="{ active: active === 'pods' }" type="button" @click="active = 'pods'">Pod</button>
          <button :class="{ active: active === 'deployments' }" type="button" @click="active = 'deployments'">Deployment</button>
        </div>
      </div>

      <template v-if="active === 'pods'">
        <DataTable
          v-if="pods.length"
          :rows="pods as unknown as Record<string, unknown>[]"
          :columns="[
            { key: 'name', label: 'Pod' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'nodeName', label: '节点' },
            { key: 'phase', label: '状态' },
            { key: 'restartCount', label: '重启次数' },
            { key: 'podIP', label: 'Pod IP' },
          ]"
        />
        <div v-if="pods.length" class="status-preview">
          <StatusPill v-for="pod in pods.slice(0, 8)" :key="`${pod.namespace}-${pod.name}`" :value="pod.phase" />
        </div>
        <EmptyState v-else title="暂无 Pod" message="请同步 Pod 缓存，或确认集群中存在工作负载。" />
      </template>

      <template v-else>
        <DataTable
          v-if="deployments.length"
          :rows="deployments as unknown as Record<string, unknown>[]"
          :columns="[
            { key: 'name', label: 'Deployment' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'replicas', label: '副本数' },
            { key: 'readyReplicas', label: 'Ready' },
            { key: 'availableReplicas', label: 'Available' },
          ]"
        />
        <EmptyState v-else title="暂无 Deployment" message="当前页面展示已同步的 Deployment 清单。" />
      </template>
    </article>
  </section>
</template>
