<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { monitorApi } from '../api/monitor';
import type { AlertEvent, AlertRule, AuditLog } from '../api/types';
import DataTable from '../components/DataTable.vue';
import EmptyState from '../components/EmptyState.vue';

const tab = ref<'events' | 'rules' | 'audit'>('events');
const events = ref<AlertEvent[]>([]);
const rules = ref<AlertRule[]>([]);
const logs = ref<AuditLog[]>([]);
const loading = ref(false);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [eventPage, rulePage, logPage] = await Promise.all([
      monitorApi.alertEvents({ page: 1, size: 50 }),
      monitorApi.alertRules({ page: 1, size: 50 }),
      monitorApi.auditLogs({ page: 1, size: 50 }),
    ]);
    events.value = eventPage.items || [];
    rules.value = rulePage.items || [];
    logs.value = logPage.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : '告警审计加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="view-stack">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading-panel">正在加载告警与审计...</div>

    <article class="panel">
      <div class="panel-head with-tabs">
        <div>
          <span class="eyebrow">Alerts / Audit</span>
          <h2>异常与操作记录</h2>
        </div>
        <div class="segmented">
          <button :class="{ active: tab === 'events' }" type="button" @click="tab = 'events'">事件</button>
          <button :class="{ active: tab === 'rules' }" type="button" @click="tab = 'rules'">规则</button>
          <button :class="{ active: tab === 'audit' }" type="button" @click="tab = 'audit'">审计</button>
        </div>
      </div>

      <DataTable
        v-if="tab === 'events' && events.length"
        :rows="events as Record<string, unknown>[]"
        :columns="[
          { key: 'title', label: '事件' },
          { key: 'level', label: '等级' },
          { key: 'status', label: '状态' },
          { key: 'createdAt', label: '时间' },
        ]"
      />
      <DataTable
        v-else-if="tab === 'rules' && rules.length"
        :rows="rules as Record<string, unknown>[]"
        :columns="[
          { key: 'name', label: '规则' },
          { key: 'metric', label: '指标' },
          { key: 'level', label: '等级' },
          { key: 'status', label: '状态' },
        ]"
      />
      <DataTable
        v-else-if="tab === 'audit' && logs.length"
        :rows="logs as Record<string, unknown>[]"
        :columns="[
          { key: 'operator', label: '操作者' },
          { key: 'action', label: '动作' },
          { key: 'resource', label: '资源' },
          { key: 'createdAt', label: '时间' },
        ]"
      />
      <EmptyState v-else title="暂无数据" message="规则、事件和审计日志均来自后端接口，不使用前端硬编码。" />
    </article>
  </section>
</template>
