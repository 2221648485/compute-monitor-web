<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Cable, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { Cluster, CreateClusterRequest, UpdateClusterRequest } from '../api/types';
import EmptyState from '../components/EmptyState.vue';
import StatusPill from '../components/StatusPill.vue';

const props = defineProps<{
  clusters: Cluster[];
}>();

const emit = defineEmits<{
  reload: [];
  'cluster-created': [clusterId: string];
}>();

const busyId = ref('');
const highlightedId = ref('');
const message = ref('');
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref('');

const form = reactive<CreateClusterRequest>({
  id: '',
  name: '',
  kubeconfig_path: '',
  prometheus_url: '',
  description: '',
  status: 'Running',
});

const isEditing = computed(() => editingId.value.length > 0);
const canSubmit = computed(() => form.id.trim().length > 0 && form.name.trim().length > 0);

function resetForm() {
  form.id = '';
  form.name = '';
  form.kubeconfig_path = '';
  form.prometheus_url = '';
  form.description = '';
  form.status = 'Running';
  editingId.value = '';
}

function openCreate() {
  error.value = '';
  message.value = '';
  resetForm();
  showForm.value = true;
}

function openEdit(cluster: Cluster) {
  error.value = '';
  message.value = '';
  editingId.value = cluster.id;
  form.id = cluster.id;
  form.name = cluster.name || '';
  form.kubeconfig_path = cluster.kubeconfig_path || '';
  form.prometheus_url = cluster.prometheus_url || '';
  form.description = cluster.description || '';
  form.status = cluster.status || 'Running';
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  resetForm();
}

function formPayload(): UpdateClusterRequest {
  return {
    name: form.name.trim(),
    kubeconfig_path: form.kubeconfig_path?.trim() || undefined,
    prometheus_url: form.prometheus_url?.trim() || undefined,
    description: form.description?.trim() || undefined,
    status: form.status || 'Running',
  };
}

async function saveCluster() {
  if (!canSubmit.value) {
    error.value = '请填写集群 ID 和集群名称。';
    return;
  }

  saving.value = true;
  error.value = '';
  message.value = '';
  try {
    if (isEditing.value) {
      await monitorApi.updateCluster(editingId.value, formPayload());
      highlightedId.value = editingId.value;
      message.value = `${form.name} 已更新。如果 kubeconfig 或 Prometheus 地址发生变化，请重新测试连接。`;
      showForm.value = false;
      resetForm();
      emit('reload');
    } else {
      const payload: CreateClusterRequest = { id: form.id.trim(), ...formPayload() };
      await monitorApi.createCluster(payload);
      highlightedId.value = payload.id;
      message.value = `${payload.name} 已创建。下一步请测试连接，然后同步 Kubernetes 资源。`;
      showForm.value = false;
      resetForm();
      emit('cluster-created', payload.id);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存集群失败';
  } finally {
    saving.value = false;
  }
}

async function test(clusterId: string) {
  busyId.value = clusterId;
  highlightedId.value = clusterId;
  message.value = '';
  error.value = '';
  try {
    const result = await monitorApi.testCluster(clusterId);
    message.value = `${clusterId} 连接${result.connected ? '成功' : '失败'}，Namespace 数量：${result.namespaceCount}。`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '连接测试失败';
  } finally {
    busyId.value = '';
  }
}

async function sync(clusterId: string) {
  busyId.value = clusterId;
  highlightedId.value = clusterId;
  message.value = '';
  error.value = '';
  try {
    await monitorApi.syncCluster(clusterId);
    message.value = `${clusterId} 已触发同步。节点、GPU、Pod 和 Deployment 数据可能需要几秒后才会出现。`;
    emit('reload');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '同步失败';
  } finally {
    busyId.value = '';
  }
}

async function remove(cluster: Cluster) {
  const ok = window.confirm(`确认删除集群 ${cluster.name || cluster.id}？后端会清理相关缓存资源。`);
  if (!ok) return;
  busyId.value = cluster.id;
  message.value = '';
  error.value = '';
  try {
    await monitorApi.deleteCluster(cluster.id);
    message.value = `${cluster.id} 已删除。`;
    emit('reload');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败';
  } finally {
    busyId.value = '';
  }
}
</script>

<template>
  <section class="view-stack">
    <div v-if="message" class="info-banner">{{ message }}</div>
    <div v-if="error" class="error-banner">{{ error }}</div>

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

      <form v-if="showForm" class="cluster-form" @submit.prevent="saveCluster">
        <div class="form-head">
          <strong>{{ isEditing ? '编辑集群' : '新增 Kubernetes 集群' }}</strong>
          <button class="icon-button" type="button" title="关闭" @click="closeForm">
            <X :size="16" />
          </button>
        </div>

        <div class="form-grid">
          <label>
            <span>集群 ID</span>
            <input v-model="form.id" :disabled="isEditing" placeholder="demo-cluster" autocomplete="off" />
          </label>
          <label>
            <span>集群名称</span>
            <input v-model="form.name" placeholder="Demo GPU Cluster" autocomplete="off" />
          </label>
          <label>
            <span>Kubeconfig 路径</span>
            <input v-model="form.kubeconfig_path" placeholder="/etc/compute-monitor/kubeconfigs/demo.yaml" autocomplete="off" />
          </label>
          <label>
            <span>Prometheus 地址</span>
            <input v-model="form.prometheus_url" placeholder="http://prometheus:9090" autocomplete="off" />
          </label>
          <label>
            <span>状态</span>
            <select v-model="form.status">
              <option value="Running">Running</option>
              <option value="NotReady">NotReady</option>
              <option value="Disabled">Disabled</option>
            </select>
          </label>
          <label class="span-2">
            <span>描述</span>
            <input v-model="form.description" placeholder="GPU lab cluster, staging cluster, etc." autocomplete="off" />
          </label>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeForm">取消</button>
          <button class="primary-button" type="submit" :disabled="saving || !canSubmit">
            <Plus :size="16" />
            {{ saving ? '正在保存' : isEditing ? '保存集群' : '创建集群' }}
          </button>
        </div>
      </form>

      <div v-if="props.clusters.length" class="cluster-grid">
        <article v-for="cluster in props.clusters" :key="cluster.id" class="cluster-card" :class="{ highlighted: highlightedId === cluster.id }">
          <div class="corner-mark" />
          <div class="cluster-card-head">
            <div>
              <strong>{{ cluster.name || cluster.id }}</strong>
              <span>{{ cluster.id }}</span>
            </div>
            <StatusPill :value="cluster.status || 'Running'" />
          </div>
          <p>{{ cluster.description || '未填写描述' }}</p>
          <dl>
            <div><dt>Prometheus</dt><dd>{{ cluster.prometheus_url || '-' }}</dd></div>
            <div><dt>Kubeconfig</dt><dd>{{ cluster.kubeconfig_path || '-' }}</dd></div>
          </dl>
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
        </article>
      </div>

      <div v-else class="empty-action">
        <EmptyState title="还没有集群" message="先新增一个 Kubernetes 集群，再测试连接并同步资源。" />
        <button class="primary-button" type="button" @click="openCreate">
          <Plus :size="16" />
          新增第一个集群
        </button>
      </div>
    </article>
  </section>
</template>
