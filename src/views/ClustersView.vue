<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Cable, Filter, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { Cluster, CreateClusterRequest, PageResult, UpdateClusterRequest } from '../api/types';
import { useToast } from '../composables/useToast';
import EmptyState from '../components/EmptyState.vue';
import StatusPill from '../components/StatusPill.vue';

const props = defineProps<{
  clusters: Cluster[];
}>();

const emit = defineEmits<{
  reload: [];
  'cluster-created': [clusterId: string];
}>();

const toast = useToast();
const busyId = ref('');
const highlightedId = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref('');
const accessMode = ref<'path' | 'upload'>('path');
const kubeconfigFile = ref<File | null>(null);
const listLoading = ref(false);
const keyword = ref('');
const statusFilter = ref('');
const localClusters = ref<Cluster[]>([]);
const localTotal = ref(0);

const form = reactive<CreateClusterRequest>({
  id: '',
  name: '',
  access_mode: 'path',
  api_server: '',
  kubeconfig_path: '',
  prometheus_url: '',
  description: '',
  status: 'Running',
});

const isEditing = computed(() => editingId.value.length > 0);
const canSubmit = computed(() => form.id.trim().length > 0 && form.name.trim().length > 0 && (isEditing.value || accessMode.value === 'path' || !!kubeconfigFile.value));
const visibleClusters = computed(() => (keyword.value || statusFilter.value ? localClusters.value : props.clusters));
const visibleTotal = computed(() => (keyword.value || statusFilter.value ? localTotal.value : props.clusters.length));

watch(
  () => props.clusters,
  (value) => {
    localClusters.value = value;
    localTotal.value = value.length;
  },
  { immediate: true },
);

function resetForm() {
  form.id = '';
  form.name = '';
  form.access_mode = 'path';
  form.api_server = '';
  form.kubeconfig_path = '';
  form.prometheus_url = '';
  form.description = '';
  form.status = 'Running';
  accessMode.value = 'path';
  kubeconfigFile.value = null;
  editingId.value = '';
}

function openCreate() {
  resetForm();
  showForm.value = true;
}

function openEdit(cluster: Cluster) {
  editingId.value = cluster.id;
  form.id = cluster.id;
  form.name = cluster.name || '';
  form.access_mode = cluster.access_mode || 'path';
  form.api_server = cluster.api_server || '';
  form.kubeconfig_path = cluster.kubeconfig_path || '';
  form.prometheus_url = cluster.prometheus_url || '';
  form.description = cluster.description || '';
  form.status = cluster.status || 'Running';
  accessMode.value = 'path';
  kubeconfigFile.value = null;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  resetForm();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  kubeconfigFile.value = input.files?.[0] || null;
}

function formPayload(): UpdateClusterRequest {
  return {
    name: form.name.trim(),
    access_mode: accessMode.value,
    api_server: form.api_server?.trim() || undefined,
    kubeconfig_path: form.kubeconfig_path?.trim() || undefined,
    prometheus_url: form.prometheus_url?.trim() || undefined,
    description: form.description?.trim() || undefined,
    status: form.status || 'Running',
  };
}

async function saveCluster() {
  if (!canSubmit.value) {
    toast.warning('请填写集群 ID、集群名称，并提供 kubeconfig 路径或上传文件。');
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await monitorApi.updateCluster(editingId.value, formPayload());
      highlightedId.value = editingId.value;
      toast.success(`${form.name} 已更新。`);
      closeForm();
      emit('reload');
      return;
    }

    if (accessMode.value === 'upload' && kubeconfigFile.value) {
      const payload = new FormData();
      payload.set('id', form.id.trim());
      payload.set('name', form.name.trim());
      payload.set('api_server', form.api_server?.trim() || '');
      payload.set('prometheus_url', form.prometheus_url?.trim() || '');
      payload.set('description', form.description?.trim() || '');
      payload.set('status', form.status || 'Running');
      payload.set('kubeconfig', kubeconfigFile.value);
      await monitorApi.uploadCluster(payload);
    } else {
      const payload: CreateClusterRequest = { id: form.id.trim(), ...formPayload() };
      await monitorApi.createCluster(payload);
    }

    highlightedId.value = form.id.trim();
    toast.success(`${form.name} 已创建，请继续测试连接并同步资源。`);
    const createdId = form.id.trim();
    closeForm();
    emit('cluster-created', createdId);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '保存集群失败');
  } finally {
    saving.value = false;
  }
}

async function searchClusters() {
  listLoading.value = true;
  try {
    const result: PageResult<Cluster> = await monitorApi.clusters({
      page: 1,
      size: 100,
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value || undefined,
    });
    localClusters.value = result.items || [];
    localTotal.value = result.total || localClusters.value.length;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '查询集群失败');
  } finally {
    listLoading.value = false;
  }
}

function clearFilters() {
  keyword.value = '';
  statusFilter.value = '';
  localClusters.value = props.clusters;
  localTotal.value = props.clusters.length;
}

async function test(clusterId: string) {
  busyId.value = clusterId;
  highlightedId.value = clusterId;
  try {
    const result = await monitorApi.testCluster(clusterId);
    const namespaceCount = result.namespaceCount ?? 0;
    toast[result.connected ? 'success' : 'warning'](`${clusterId} 连接${result.connected ? '成功' : '失败'}，Namespace 数量：${namespaceCount}。`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '连接测试失败');
  } finally {
    busyId.value = '';
  }
}

async function sync(clusterId: string) {
  busyId.value = clusterId;
  highlightedId.value = clusterId;
  try {
    await monitorApi.syncCluster(clusterId);
    toast.success(`${clusterId} 已触发同步，资源数据可能需要几秒后出现。`);
    emit('reload');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '同步失败');
  } finally {
    busyId.value = '';
  }
}

async function remove(cluster: Cluster) {
  const ok = window.confirm(`确认删除集群 ${cluster.name || cluster.id}？后端会清理相关缓存资源。`);
  if (!ok) return;
  busyId.value = cluster.id;
  try {
    await monitorApi.deleteCluster(cluster.id);
    toast.success(`${cluster.id} 已删除。`);
    emit('reload');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '删除失败');
  } finally {
    busyId.value = '';
  }
}
</script>

<template>
  <section class="view-stack">
    <article class="panel">
      <div class="panel-head with-tabs">
        <div>
          <span class="eyebrow">Cluster Registry</span>
          <h2>集群纳管</h2>
        </div>
        <button class="primary-button" type="button" @click="openCreate">
          <Plus :size="16" />
          新增集群
        </button>
      </div>

      <div class="toolbar-line cluster-toolbar">
        <label class="search-field inline-search">
          <span>搜索集群</span>
          <div class="search-box">
            <Search :size="16" />
            <input v-model="keyword" placeholder="ID / 名称 / 描述" autocomplete="off" @keyup.enter="searchClusters" />
          </div>
        </label>
        <label class="cluster-select compact">
          <span>状态</span>
          <select v-model="statusFilter" @change="searchClusters">
            <option value="">全部</option>
            <option value="Running">Running</option>
            <option value="NotReady">NotReady</option>
            <option value="Disabled">Disabled</option>
          </select>
        </label>
        <button type="button" :disabled="listLoading" @click="searchClusters">
          <Filter :size="15" />
          筛选
        </button>
        <button type="button" @click="clearFilters">清空</button>
      </div>

      <form v-if="showForm" class="cluster-form" @submit.prevent="saveCluster">
        <div class="form-head">
          <strong>{{ isEditing ? '编辑集群' : '新增 Kubernetes 集群' }}</strong>
          <button class="icon-button" type="button" title="关闭" @click="closeForm">
            <X :size="16" />
          </button>
        </div>

        <div v-if="!isEditing" class="segmented compact-segment">
          <button :class="{ active: accessMode === 'path' }" type="button" @click="accessMode = 'path'">路径接入</button>
          <button :class="{ active: accessMode === 'upload' }" type="button" @click="accessMode = 'upload'">上传 kubeconfig</button>
        </div>

        <div class="form-grid">
          <label>
            <span>集群 ID</span>
            <input v-model="form.id" :disabled="isEditing" placeholder="demo-cluster" autocomplete="off" />
          </label>
          <label>
            <span>集群名称</span>
            <input v-model="form.name" placeholder="测试" autocomplete="off" />
          </label>
          <label>
            <span>API Server</span>
            <input v-model="form.api_server" placeholder="https://10.0.0.1:6443" autocomplete="off" />
          </label>
          <label>
            <span>Prometheus URL</span>
            <input v-model="form.prometheus_url" placeholder="http://prometheus:9090" autocomplete="off" />
          </label>
          <label v-if="accessMode === 'path'">
            <span>Kubeconfig Path</span>
            <input v-model="form.kubeconfig_path" placeholder="/etc/compute-monitor/kubeconfigs/demo.yaml" autocomplete="off" />
          </label>
          <label v-else class="file-field">
            <span>Kubeconfig File</span>
            <input type="file" accept=".yaml,.yml,.conf,.config" @change="onFileChange" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="form.status">
              <option value="Running">Running</option>
              <option value="NotReady">NotReady</option>
              <option value="Disabled">Disabled</option>
            </select>
          </label>
          <label class="span-2">
            <span>描述</span>
            <input v-model="form.description" placeholder="例如：测试集群、训练集群、边缘 GPU 集群" autocomplete="off" />
          </label>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeForm">取消</button>
          <button class="primary-button" type="submit" :disabled="saving || !canSubmit">
            <Upload v-if="accessMode === 'upload' && !isEditing" :size="16" />
            <Plus v-else :size="16" />
            {{ saving ? '正在保存' : isEditing ? '保存集群' : '创建集群' }}
          </button>
        </div>
      </form>

      <div v-if="visibleClusters.length" class="cluster-list">
        <article v-for="cluster in visibleClusters" :key="cluster.id" class="cluster-card wide-cluster-card" :class="{ highlighted: highlightedId === cluster.id }">
          <div class="corner-mark" />
          <div class="cluster-main-row">
            <div class="cluster-title-block">
              <strong>{{ cluster.name || cluster.id }}</strong>
              <span>{{ cluster.id }}</span>
            </div>
            <div class="cluster-state-actions">
              <StatusPill :value="cluster.status || 'Running'" />
              <div class="card-actions">
                <button type="button" @click="test(cluster.id)" :disabled="busyId === cluster.id">
                  <Cable :size="15" />
                  测试连接
                </button>
                <button type="button" @click="sync(cluster.id)" :disabled="busyId === cluster.id">
                  <RefreshCw :size="15" />
                  同步资源
                </button>
                <button type="button" @click="openEdit(cluster)" :disabled="busyId === cluster.id">
                  <Pencil :size="15" />
                  编辑
                </button>
                <button type="button" @click="remove(cluster)" :disabled="busyId === cluster.id">
                  <Trash2 :size="15" />
                  删除
                </button>
              </div>
            </div>
          </div>

          <div class="cluster-detail-grid">
            <div>
              <span>API Server</span>
              <strong>{{ cluster.api_server || '-' }}</strong>
            </div>
            <div>
              <span>Prometheus</span>
              <strong>{{ cluster.prometheus_url || '-' }}</strong>
            </div>
            <div>
              <span>Kubeconfig</span>
              <strong>{{ cluster.kubeconfig_path || '-' }}</strong>
            </div>
            <div>
              <span>描述</span>
              <strong>{{ cluster.description || '未填写描述' }}</strong>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-action">
        <EmptyState title="还没有集群" message="先新增一个 Kubernetes 集群，再测试连接并同步资源。" />
        <button class="primary-button" type="button" @click="openCreate">
          <Plus :size="16" />
          新增第一个集群
        </button>
      </div>

      <p class="muted-line">当前显示 {{ visibleClusters.length }} / {{ visibleTotal }} 个集群。</p>
    </article>
  </section>
</template>
