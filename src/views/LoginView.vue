<script setup lang="ts">
import { ref } from 'vue';
import { LockKeyhole, ServerCog } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { User } from '../api/types';
import { useToast } from '../composables/useToast';

const emit = defineEmits<{
  'logged-in': [user: User];
}>();

const toast = useToast();
const username = ref('');
const password = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    const result = await monitorApi.login(username.value, password.value);
    emit('logged-in', result.user);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-screen">
    <section class="login-hero">
      <span class="eyebrow">Compute Monitor</span>
      <h1>GPU 集群监控与迁移控制台</h1>
      <p>
        接入 Kubernetes 缓存、Prometheus 指标和 GPU 资源视图，用于查看集群健康、节点压力、工作负载、
        告警审计和迁移任务。
      </p>
    </section>

    <form class="login-panel" @submit.prevent="submit">
      <ServerCog :size="26" />
      <h2>管理员登录</h2>
      <label>
        <span>用户名</span>
        <input v-model="username" autocomplete="username" />
      </label>
      <label>
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <button class="primary-button wide" type="submit" :disabled="loading">
        <LockKeyhole :size="16" />
        {{ loading ? '正在登录' : '登录' }}
      </button>
    </form>
  </main>
</template>
