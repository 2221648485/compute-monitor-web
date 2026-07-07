<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { KeyRound, Pencil, Plus, RotateCcw, ShieldCheck, UserRoundCog, X } from 'lucide-vue-next';
import { monitorApi } from '../api/monitor';
import type { CreateUserRequest, User } from '../api/types';
import EmptyState from '../components/EmptyState.vue';
import StatusPill from '../components/StatusPill.vue';

const users = ref<User[]>([]);
const total = ref(0);
const loading = ref(false);
const creating = ref(false);
const resettingId = ref<number | null>(null);
const message = ref('');
const error = ref('');
const showCreate = ref(false);
const filterRole = ref('');
const editingUserId = ref<number | null>(null);

const form = reactive<CreateUserRequest>({
  username: '',
  password: '',
  display_name: '',
  email: '',
  phone: '',
  role: 'viewer',
  status: 1,
});

const canSubmit = computed(
  () =>
    form.username.trim().length >= 3 &&
    (editingUserId.value !== null || form.password.length >= 8) &&
    form.display_name.trim().length > 0 &&
    form.role.length > 0,
);

const roleMatrix = [
  { role: 'admin', scope: '当前已实现：admin 可以访问 admin-only 后台接口，管理用户、集群、资源、告警、审计和迁移。' },
  { role: 'operator', scope: '后端用户模型中已定义，但多数业务路由仍要求 admin，角色级授权尚未完整实现。' },
  { role: 'viewer', scope: '后端用户模型中已定义，但只读权限接口和路由策略尚未完整实现。' },
];

function displayName(user: User) {
  return user.display_name || user.displayName || user.username;
}

function statusText(status: number) {
  return status === 1 ? 'enabled' : 'disabled';
}

function resetForm() {
  form.username = '';
  form.password = '';
  form.display_name = '';
  form.email = '';
  form.phone = '';
  form.role = 'viewer';
  form.status = 1;
  editingUserId.value = null;
}

function openCreate() {
  resetForm();
  error.value = '';
  message.value = '';
  showCreate.value = true;
}

function openEdit(user: User) {
  error.value = '';
  message.value = '';
  editingUserId.value = user.id;
  form.username = user.username;
  form.password = '';
  form.display_name = displayName(user);
  form.email = user.email || '';
  form.phone = user.phone || '';
  form.role = user.role;
  form.status = user.status;
  showCreate.value = true;
}

function closeForm() {
  showCreate.value = false;
  resetForm();
}

async function loadUsers() {
  loading.value = true;
  error.value = '';
  try {
    const result = await monitorApi.users({
      page: 1,
      size: 100,
      role: filterRole.value || undefined,
    });
    users.value = result.items || [];
    total.value = result.total || users.value.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载用户列表失败';
  } finally {
    loading.value = false;
  }
}

async function saveUser() {
  if (!canSubmit.value) {
    error.value = '请填写用户名、显示名、角色；新增用户还需要初始密码。';
    return;
  }
  creating.value = true;
  error.value = '';
  message.value = '';
  try {
    if (editingUserId.value !== null) {
      await monitorApi.updateUser(editingUserId.value, {
        display_name: form.display_name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        role: form.role,
      });
      message.value = `${form.username} 已更新。`;
    } else {
      await monitorApi.createUser({
        username: form.username.trim(),
        password: form.password,
        display_name: form.display_name.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        role: form.role,
        status: form.status,
      });
      message.value = `${form.username} 已创建。`;
    }
    closeForm();
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存用户失败';
  } finally {
    creating.value = false;
  }
}

async function toggleStatus(user: User) {
  error.value = '';
  message.value = '';
  try {
    const nextStatus = user.status === 1 ? 0 : 1;
    await monitorApi.updateUserStatus(user.id, nextStatus);
    message.value = `${user.username} 已${nextStatus === 1 ? '启用' : '禁用'}。`;
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '修改用户状态失败';
  }
}

async function resetPassword(user: User) {
  const password = window.prompt(`请输入 ${user.username} 的新密码，至少 8 位。`);
  if (!password) return;
  if (password.length < 8) {
    error.value = '新密码至少 8 位。';
    return;
  }
  resettingId.value = user.id;
  error.value = '';
  message.value = '';
  try {
    await monitorApi.resetUserPassword(user.id, password);
    message.value = `${user.username} 的密码已重置。`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重置密码失败';
  } finally {
    resettingId.value = null;
  }
}

onMounted(loadUsers);
</script>

<template>
  <section class="view-stack">
    <div v-if="message" class="info-banner">{{ message }}</div>
    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="panel-grid two">
      <article class="panel">
        <div class="panel-head with-tabs">
          <div>
            <span class="eyebrow">Users</span>
            <h2>后台用户</h2>
          </div>
          <button class="primary-button" type="button" @click="openCreate">
            <Plus :size="16" />
            新增用户
          </button>
        </div>

        <div class="toolbar-line">
          <label class="cluster-select">
            <span>角色筛选</span>
            <select v-model="filterRole" @change="loadUsers">
              <option value="">全部</option>
              <option value="admin">admin</option>
              <option value="operator">operator</option>
              <option value="viewer">viewer</option>
            </select>
          </label>
          <button type="button" @click="loadUsers">
            <RotateCcw :size="15" />
            刷新
          </button>
        </div>

        <form v-if="showCreate" class="cluster-form" @submit.prevent="saveUser">
          <div class="form-head">
            <strong>{{ editingUserId === null ? '新增后台用户' : '编辑后台用户' }}</strong>
            <button class="icon-button" type="button" title="关闭" @click="closeForm">
              <X :size="16" />
            </button>
          </div>
          <div class="form-grid">
            <label>
              <span>用户名</span>
              <input v-model="form.username" :disabled="editingUserId !== null" placeholder="operator01" autocomplete="off" />
            </label>
            <label v-if="editingUserId === null">
              <span>初始密码</span>
              <input v-model="form.password" type="password" placeholder="至少 8 位" autocomplete="new-password" />
            </label>
            <label>
              <span>显示名</span>
              <input v-model="form.display_name" placeholder="运维同学" autocomplete="off" />
            </label>
            <label>
              <span>邮箱</span>
              <input v-model="form.email" placeholder="name@example.com" autocomplete="off" />
            </label>
            <label>
              <span>手机号</span>
              <input v-model="form.phone" placeholder="可选" autocomplete="off" />
            </label>
            <label>
              <span>角色</span>
              <select v-model="form.role">
                <option value="admin">admin</option>
                <option value="operator">operator</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeForm">取消</button>
            <button class="primary-button" type="submit" :disabled="creating || !canSubmit">
              <Plus :size="16" />
              {{ creating ? '正在保存' : editingUserId === null ? '创建用户' : '保存用户' }}
            </button>
          </div>
        </form>

        <div v-if="loading" class="loading-panel">正在加载用户...</div>
        <div v-else-if="users.length" class="user-list">
          <article v-for="item in users" :key="item.id" class="user-row">
            <div class="user-avatar"><UserRoundCog :size="18" /></div>
            <div>
              <strong>{{ displayName(item) }}</strong>
              <span>{{ item.username }} / {{ item.email || '无邮箱' }}</span>
            </div>
            <StatusPill :value="item.role" />
            <StatusPill :value="statusText(item.status)" />
            <div class="card-actions">
              <button type="button" @click="openEdit(item)">
                <Pencil :size="15" />
                编辑
              </button>
              <button type="button" @click="toggleStatus(item)">
                {{ item.status === 1 ? '禁用' : '启用' }}
              </button>
              <button type="button" :disabled="resettingId === item.id" @click="resetPassword(item)">
                <KeyRound :size="15" />
                重置密码
              </button>
            </div>
          </article>
        </div>
        <EmptyState v-else title="暂无用户" message="后端通常会初始化一个 bootstrap admin 账号。" />
        <p class="muted-line">共 {{ total }} 个用户。数据来自 /api/admin/users。</p>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">RBAC Boundary</span>
            <h2>角色能力边界</h2>
          </div>
          <ShieldCheck :size="22" />
        </div>
        <div class="compact-list">
          <div v-for="item in roleMatrix" :key="item.role" class="role-card">
            <StatusPill :value="item.role" />
            <p>{{ item.scope }}</p>
          </div>
        </div>
        <div class="warning-note">
          当前页面只接入后端真实存在的用户管理能力。完整 RBAC 还需要后端提供角色、权限、角色-权限绑定、菜单/资源和权限中间件接口。
        </div>
      </article>
    </div>
  </section>
</template>
