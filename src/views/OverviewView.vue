<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { monitorApi } from '../api/monitor';
import type { Cluster, ComputeResource, GPUSummary, ResourceOverview } from '../api/types';
import { useToast } from '../composables/useToast';
import EmptyState from '../components/EmptyState.vue';
import LoadBar from '../components/LoadBar.vue';
import StatTile from '../components/StatTile.vue';

const props = defineProps<{
  clusters: Cluster[];
  selectedClusterId: string;
}>();

const toast = useToast();
const overview = ref<ResourceOverview | null>(null);
const compute = ref<ComputeResource | null>(null);
const gpu = ref<GPUSummary | null>(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    try {
      overview.value = await monitorApi.resourceOverview();
    } catch (err) {
      toast.warning(err instanceof Error ? err.message : '跨集群资源概览暂不可用');
    }
    if (props.selectedClusterId) {
      compute.value = await monitorApi.computeResource(props.selectedClusterId);
      try {
        gpu.value = await monitorApi.gpuSummary(props.selectedClusterId);
      } catch (err) {
        toast.warning(err instanceof Error ? err.message : 'GPU 汇总暂不可用');
      }
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '总览加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="view-stack">
    <div class="stat-grid">
      <StatTile label="纳管集群" :value="clusters.length" detail="来自 /api/admin/clusters" />
      <StatTile label="CPU 总核数" :value="compute?.summary.cpuCore ?? '-'" :detail="compute?.source || '选择集群后显示'" />
      <StatTile label="GPU 总数" :value="gpu?.total ?? compute?.summary.gpuCount ?? '-'" :detail="gpu?.source || 'K8s / Prometheus 聚合'" />
      <StatTile label="可用 GPU" :value="compute?.summary.availableGPU ?? '-'" detail="资源感知估算" />
    </div>

    <div v-if="loading" class="loading-panel">正在加载总览...</div>

    <div v-if="compute" class="panel-grid two">
      <article class="panel">
        <div class="panel-head">
          <span class="eyebrow">Resource Pressure</span>
          <h2>当前集群负载</h2>
        </div>
        <div class="load-list">
          <LoadBar label="CPU" :value="compute.nodes.reduce((sum, item) => sum + item.utilization.cpuPercent, 0) / Math.max(1, compute.nodes.length)" />
          <LoadBar label="Memory" :value="compute.nodes.reduce((sum, item) => sum + item.utilization.memoryPercent, 0) / Math.max(1, compute.nodes.length)" />
          <LoadBar label="GPU" :value="compute.nodes.reduce((sum, item) => sum + item.utilization.gpuPercent, 0) / Math.max(1, compute.nodes.length)" />
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <span class="eyebrow">Node Snapshot</span>
          <h2>节点资源快照</h2>
        </div>
        <div class="node-list compact-list">
          <div v-for="node in compute.nodes.slice(0, 6)" :key="node.nodeName" class="list-row">
            <strong>{{ node.nodeName }}</strong>
            <span>{{ node.internalIP || '-' }}</span>
            <span>{{ node.capacity.cpuCore }}C / {{ node.capacity.gpuCount }} GPU</span>
          </div>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-head">
        <span class="eyebrow">Fleet Overview</span>
        <h2>跨集群资源概览</h2>
      </div>
      <div v-if="overview?.clusters?.length" class="resource-strip">
        <div v-for="cluster in overview.clusters" :key="cluster.clusterId" class="resource-card">
          <strong>{{ cluster.clusterId }}</strong>
          <span>{{ cluster.compute.cpuCore }} CPU</span>
          <span>{{ cluster.compute.gpuCount }} GPU</span>
          <small>Carbon {{ cluster.energy.averageCarbonIntensity?.toFixed?.(1) ?? 0 }}</small>
        </div>
      </div>
      <EmptyState v-else title="暂无跨集群资源概览" message="请先配置集群并执行 Kubernetes 同步。" />
    </article>
  </section>
</template>
