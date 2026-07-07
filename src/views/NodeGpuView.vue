<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Server } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { GPUItem, NodeItem } from '../api/types';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBar from '../components/LoadBar.vue';
import StatusPill from '../components/StatusPill.vue';

const props = defineProps<{
  clusterId: string;
}>();

const emit = defineEmits<{
  'open-clusters': [];
}>();

const nodes = ref<NodeItem[]>([]);
const gpus = ref<GPUItem[]>([]);
const loading = ref(false);
const error = ref('');
const gpuWarning = ref('');

async function load() {
  nodes.value = [];
  gpus.value = [];
  gpuWarning.value = '';
  if (!props.clusterId) return;
  loading.value = true;
  error.value = '';
  try {
    const nodePage = await monitorApi.nodes(props.clusterId, { page: 1, size: 100 });
    nodes.value = nodePage.items || [];
    try {
      const gpuList = await monitorApi.gpus(props.clusterId);
      gpus.value = Array.isArray(gpuList) ? gpuList : [];
    } catch (err) {
      gpuWarning.value = err instanceof Error ? err.message : 'GPU 遥测暂不可用';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载节点资源失败';
  } finally {
    loading.value = false;
  }
}

function gb(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

onMounted(load);
watch(() => props.clusterId, load);
</script>

<template>
  <section class="view-stack">
    <div v-if="!clusterId" class="empty-action">
      <EmptyState title="未选择集群" message="请先新增或选择集群，并同步 Kubernetes 资源后再查看节点和 GPU。" />
      <button class="primary-button" type="button" @click="emit('open-clusters')">
        <Server :size="16" />
        打开集群纳管
      </button>
    </div>
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="gpuWarning" class="info-banner">{{ gpuWarning }}</div>
    <div v-if="loading" class="loading-panel">正在加载节点和 GPU 遥测...</div>

    <template v-if="clusterId">
      <div class="panel-grid two">
        <article class="panel">
          <div class="panel-head">
            <span class="eyebrow">Nodes</span>
            <h2>节点状态</h2>
          </div>
          <div v-if="nodes.length" class="node-list">
            <div v-for="node in nodes" :key="node.name" class="node-card">
              <div>
                <strong>{{ node.name }}</strong>
                <span>{{ node.internalIP || '-' }}</span>
              </div>
              <StatusPill :value="node.status" />
              <dl>
                <div><dt>CPU</dt><dd>{{ node.cpuCapacity }} Core</dd></div>
                <div><dt>Memory</dt><dd>{{ gb(node.memoryCapacityBytes) }}</dd></div>
                <div><dt>GPU</dt><dd>{{ node.gpuCount }}</dd></div>
              </dl>
            </div>
          </div>
          <EmptyState v-else title="暂无节点数据" message="请先执行集群同步，然后重试。" />
        </article>

        <article class="panel">
          <div class="panel-head">
            <span class="eyebrow">GPU Telemetry</span>
            <h2>GPU 使用率</h2>
          </div>
          <div v-if="gpus.length" class="load-list">
            <div v-for="gpu in gpus.slice(0, 8)" :key="`${gpu.nodeName}-${gpu.gpuIndex}`" class="gpu-row">
              <strong>{{ gpu.nodeName }} / GPU {{ gpu.gpuIndex }}</strong>
              <LoadBar label="Core" :value="gpu.utilization" />
              <LoadBar label="Memory" :value="gpu.memoryUsageRate" />
              <small>{{ gpu.temperature.toFixed(1) }} C</small>
            </div>
          </div>
          <EmptyState v-else title="暂无 GPU 遥测" message="未发现 GPU 节点，或 Prometheus/DCGM 指标尚未接入。" />
        </article>
      </div>

      <article class="panel">
        <div class="panel-head">
          <span class="eyebrow">Inventory</span>
          <h2>节点清单</h2>
        </div>
        <DataTable
          v-if="nodes.length"
          :rows="nodes as unknown as Record<string, unknown>[]"
          :columns="[
            { key: 'name', label: '节点' },
            { key: 'internalIP', label: 'IP' },
            { key: 'status', label: '状态' },
            { key: 'cpuCapacity', label: 'CPU' },
            { key: 'gpuCount', label: 'GPU' },
            { key: 'containerRuntime', label: 'Runtime' },
          ]"
        />
        <EmptyState v-else title="暂无节点清单" />
      </article>
    </template>
  </section>
</template>
