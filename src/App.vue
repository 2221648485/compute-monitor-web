<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Activity, Bell, Boxes, Cpu, GitBranch, Layers, LogOut, RefreshCw, Server, Users } from 'lucide-vue-next';
import { ApiError, tokenStore } from './api/client';
import { monitorApi } from './api/monitor';
import type { Cluster, User } from './api/types';
import LoginView from './views/LoginView.vue';
import OverviewView from './views/OverviewView.vue';
import ClustersView from './views/ClustersView.vue';
import NodeGpuView from './views/NodeGpuView.vue';
import WorkloadsView from './views/WorkloadsView.vue';
import MigrationView from './views/MigrationView.vue';
import AlertsAuditView from './views/AlertsAuditView.vue';
import UsersRbacView from './views/UsersRbacView.vue';

type TabKey = 'overview' | 'clusters' | 'nodes' | 'workloads' | 'migration' | 'alerts' | 'users';

const tabs = [
  { key: 'overview', label: '总览', icon: Activity },
  { key: 'clusters', label: '集群', icon: Server },
  { key: 'nodes', label: '节点 / GPU', icon: Cpu },
  { key: 'workloads', label: '工作负载', icon: Boxes },
  { key: 'migration', label: '迁移', icon: GitBranch },
  { key: 'alerts', label: '告警 / 审计', icon: Bell },
  { key: 'users', label: '用户 / RBAC', icon: Users },
] as const;

const activeTab = ref<TabKey>('overview');
const user = ref<User | null>(null);
const clusters = ref<Cluster[]>([]);
const selectedClusterId = ref('');
const loadingShell = ref(true);
const globalError = ref('');
const refreshKey = ref(0);

const selectedCluster = computed(() => clusters.value.find((cluster) => cluster.id === selectedClusterId.value));

async function loadClusters(preferredClusterId?: string) {
  const result = await monitorApi.clusters({ page: 1, size: 100 });
  clusters.value = result.items || [];
  if (preferredClusterId && clusters.value.some((cluster) => cluster.id === preferredClusterId)) {
    selectedClusterId.value = preferredClusterId;
  } else if (!selectedClusterId.value && clusters.value.length > 0) {
    selectedClusterId.value = clusters.value[0].id;
  } else if (selectedClusterId.value && !clusters.value.some((cluster) => cluster.id === selectedClusterId.value)) {
    selectedClusterId.value = clusters.value[0]?.id || '';
  }
}

async function bootstrap() {
  loadingShell.value = true;
  globalError.value = '';
  try {
    if (tokenStore.accessToken) {
      user.value = await monitorApi.me();
      await loadClusters();
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      user.value = null;
    } else {
      globalError.value = error instanceof Error ? error.message : '初始化失败';
    }
  } finally {
    loadingShell.value = false;
  }
}

async function onLoggedIn(nextUser: User) {
  user.value = nextUser;
  await loadClusters();
}

function logout() {
  monitorApi.logout();
  user.value = null;
  clusters.value = [];
  selectedClusterId.value = '';
}

async function refreshAll() {
  globalError.value = '';
  try {
    await loadClusters();
    refreshKey.value += 1;
  } catch (error) {
    globalError.value = error instanceof Error ? error.message : '刷新失败';
  }
}

async function onClusterCreated(clusterId: string) {
  await loadClusters(clusterId);
  refreshKey.value += 1;
}

function openClusters() {
  activeTab.value = 'clusters';
}

onMounted(bootstrap);
</script>

<template>
  <LoginView v-if="!user && !loadingShell" @logged-in="onLoggedIn" />

  <main v-else class="app-shell">
    <aside class="side-nav">
      <div class="brand-block">
        <div class="brand-mark"><Layers :size="20" /></div>
        <div>
          <strong>Compute Monitor</strong>
          <span>GPU Resource Console</span>
        </div>
      </div>

      <nav>
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="17" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="side-footer">
        <span>{{ user?.display_name || user?.displayName || user?.username || 'Admin' }}</span>
        <button class="icon-button" type="button" title="退出登录" @click="logout">
          <LogOut :size="17" />
        </button>
      </div>
    </aside>

    <section class="workspace">
      <header class="top-bar">
        <div>
          <span class="eyebrow">Kubernetes / Prometheus / GPU</span>
          <h1>{{ tabs.find((tab) => tab.key === activeTab)?.label }}</h1>
        </div>
        <div class="top-actions">
          <label class="cluster-select compact">
            <span>当前集群</span>
            <select v-model="selectedClusterId">
              <option value="">未选择</option>
              <option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
                {{ cluster.name || cluster.id }}
              </option>
            </select>
          </label>
          <button class="primary-button" type="button" @click="refreshAll">
            <RefreshCw :size="16" />
            刷新
          </button>
        </div>
      </header>

      <div v-if="globalError" class="error-banner">{{ globalError }}</div>
      <div v-if="loadingShell" class="loading-panel">正在连接后端...</div>
      <template v-else>
        <OverviewView v-if="activeTab === 'overview'" :key="refreshKey" :clusters="clusters" :selected-cluster-id="selectedClusterId" />
        <ClustersView
          v-else-if="activeTab === 'clusters'"
          :key="refreshKey"
          :clusters="clusters"
          @reload="refreshAll"
          @cluster-created="onClusterCreated"
        />
        <NodeGpuView
          v-else-if="activeTab === 'nodes'"
          :key="`${refreshKey}-${selectedClusterId}`"
          :cluster-id="selectedClusterId"
          @open-clusters="openClusters"
        />
        <WorkloadsView
          v-else-if="activeTab === 'workloads'"
          :key="`${refreshKey}-${selectedClusterId}`"
          :cluster-id="selectedClusterId"
          @open-clusters="openClusters"
        />
        <MigrationView v-else-if="activeTab === 'migration'" :key="refreshKey" :cluster="selectedCluster" />
        <AlertsAuditView v-else-if="activeTab === 'alerts'" :key="refreshKey" />
        <UsersRbacView v-else :key="refreshKey" />
      </template>
    </section>
  </main>
</template>
