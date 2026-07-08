<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, Search, Server, X } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { Deployment, PageResult, WorkloadPod } from '../api/types';
import { useToast } from '../composables/useToast';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';

const props = defineProps<{
  clusterId: string;
}>();

const emit = defineEmits<{
  'open-clusters': [];
}>();

const toast = useToast();
const pods = ref<WorkloadPod[]>([]);
const deployments = ref<Deployment[]>([]);
const active = ref<'pods' | 'deployments'>('pods');
const loading = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const rows = computed(() => (active.value === 'pods' ? pods.value : deployments.value));
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
const searchLabel = computed(() => (active.value === 'pods' ? '搜索 Pod' : '搜索 Deployment'));

async function load() {
  pods.value = [];
  deployments.value = [];
  if (!props.clusterId) return;
  loading.value = true;
  try {
    const query = {
      page: page.value,
      size: pageSize.value,
      keyword: keyword.value.trim() || undefined,
    };
    if (active.value === 'pods') {
      const podPage: PageResult<WorkloadPod> = await monitorApi.pods(props.clusterId, query);
      pods.value = podPage.items || [];
      total.value = podPage.total || 0;
    } else {
      const deploymentPage: PageResult<Deployment> = await monitorApi.deployments(props.clusterId, query);
      deployments.value = deploymentPage.items || [];
      total.value = deploymentPage.total || 0;
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '加载工作负载失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  load();
}

function clearSearch() {
  keyword.value = '';
  search();
}

function changePage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value);
  load();
}

function changePageSize() {
  page.value = 1;
  load();
}

function switchTab(tab: 'pods' | 'deployments') {
  active.value = tab;
  page.value = 1;
  keyword.value = '';
  load();
}

onMounted(load);
watch(() => props.clusterId, () => {
  page.value = 1;
  load();
});
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
    <div v-if="loading" class="loading-panel">正在加载工作负载...</div>

    <article v-if="clusterId" class="panel">
      <div class="panel-head with-tabs">
        <div>
          <span class="eyebrow">Workloads</span>
          <h2>Pod 与 Deployment</h2>
        </div>
        <div class="segmented">
          <button :class="{ active: active === 'pods' }" type="button" @click="switchTab('pods')">Pod</button>
          <button :class="{ active: active === 'deployments' }" type="button" @click="switchTab('deployments')">Deployment</button>
        </div>
      </div>

      <div class="toolbar-line workload-toolbar">
        <label class="search-field inline-search workload-search">
          <span>{{ searchLabel }}</span>
          <div class="search-box" :class="{ 'has-clear': keyword }">
            <Search :size="16" />
            <input v-model="keyword" placeholder="名称 / Namespace / 节点 / IP" autocomplete="off" @keyup.enter="search" />
            <button v-if="keyword" class="clear-search-button" type="button" title="清空搜索" @click="clearSearch">
              <X :size="14" />
            </button>
          </div>
        </label>
        <button class="primary-button" type="button" @click="search">
          <Search :size="15" />
          搜索
        </button>
      </div>

      <template v-if="active === 'pods'">
        <div v-if="pods.length" class="scroll-table workload-table">
          <DataTable
            :rows="pods as unknown as Record<string, unknown>[]"
            :columns="[
              { key: 'name', label: 'Pod' },
              { key: 'namespace', label: 'Namespace' },
              { key: 'nodeName', label: 'Node' },
              { key: 'phase', label: 'Status' },
              { key: 'restartCount', label: 'Restarts' },
              { key: 'podIP', label: 'Pod IP' },
            ]"
          />
        </div>
        <EmptyState v-else title="暂无 Pod" message="请同步 Pod 缓存，或确认搜索条件是否正确。" />
      </template>

      <template v-else>
        <div v-if="deployments.length" class="scroll-table workload-table">
          <DataTable
            :rows="deployments as unknown as Record<string, unknown>[]"
            :columns="[
              { key: 'name', label: 'Deployment' },
              { key: 'namespace', label: 'Namespace' },
              { key: 'replicas', label: 'Replicas' },
              { key: 'readyReplicas', label: 'Ready' },
              { key: 'availableReplicas', label: 'Available' },
            ]"
          />
        </div>
        <EmptyState v-else title="暂无 Deployment" message="当前页面展示已同步的 Deployment 清单。" />
      </template>

      <div class="pagination-bar">
        <span>共 {{ total }} 条，当前第 {{ page }} / {{ totalPages }} 页</span>
        <div class="pagination-controls">
          <label>
            <span>每页</span>
            <select v-model.number="pageSize" @change="changePageSize">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <div class="pagination-actions">
            <button type="button" :disabled="page <= 1" @click="changePage(page - 1)">
              <ChevronLeft :size="15" />
              上一页
            </button>
            <button type="button" :disabled="page >= totalPages" @click="changePage(page + 1)">
              下一页
              <ChevronRight :size="15" />
            </button>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
