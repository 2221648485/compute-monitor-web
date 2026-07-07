import { api, tokenStore } from './client';
import type {
  AlertEvent,
  AlertRule,
  AuditLog,
  Cluster,
  CreateClusterRequest,
  CreateUserRequest,
  ComputeResource,
  Deployment,
  GPUSummary,
  GPUItem,
  LoginResponse,
  MigrationPlan,
  NodeItem,
  PageResult,
  ResourceOverview,
  UpdateClusterRequest,
  UpdateUserRequest,
  User,
  WorkloadPod,
} from './types';

const admin = '/api/admin';

export const monitorApi = {
  async login(username: string, password: string) {
    const result = await api.post<LoginResponse>(`${admin}/auth/login`, { username, password });
    tokenStore.set(result.access_token, result.refresh_token);
    return result;
  },
  logout() {
    tokenStore.clear();
  },
  me: () => api.get<User>(`${admin}/auth/me`),
  health: () => fetch('/healthz').then((response) => response.ok),
  users: (query?: Record<string, unknown>) => api.get<PageResult<User>>(`${admin}/users`, query),
  createUser: (payload: CreateUserRequest) => api.post<User>(`${admin}/users`, payload),
  updateUser: (userId: number, payload: UpdateUserRequest) => api.put<User>(`${admin}/users/${userId}`, payload),
  updateUserStatus: (userId: number, status: number) => api.put<{ id: number; status: number }>(`${admin}/users/${userId}/status`, { status }),
  resetUserPassword: (userId: number, password: string) => api.put<{ id: number }>(`${admin}/users/${userId}/password`, { password }),
  clusters: (query?: Record<string, unknown>) => api.get<PageResult<Cluster>>(`${admin}/clusters`, query),
  createCluster: (payload: CreateClusterRequest) => api.post<Cluster>(`${admin}/clusters`, payload),
  updateCluster: (clusterId: string, payload: UpdateClusterRequest) => api.put<Cluster>(`${admin}/clusters/${clusterId}`, payload),
  deleteCluster: (clusterId: string) => api.delete<{ clusterId: string; deleted: boolean }>(`${admin}/clusters/${clusterId}`),
  testCluster: (clusterId: string) => api.post<{ clusterId: string; connected: boolean; namespaceCount: number }>(`${admin}/clusters/${clusterId}/test`),
  syncCluster: (clusterId: string) => api.post<{ synced?: boolean }>(`${admin}/clusters/${clusterId}/k8s/sync`),
  resourceOverview: () => api.get<ResourceOverview>(`${admin}/resources/overview`),
  computeResource: (clusterId: string) => api.get<ComputeResource>(`${admin}/clusters/${clusterId}/resources/compute`),
  nodes: (clusterId: string, query?: Record<string, unknown>) => api.get<PageResult<NodeItem>>(`${admin}/clusters/${clusterId}/nodes`, query),
  gpus: (clusterId: string) => api.get<GPUItem[]>(`${admin}/clusters/${clusterId}/gpus`),
  gpuSummary: (clusterId: string) => api.get<GPUSummary>(`${admin}/clusters/${clusterId}/gpus/summary`),
  pods: (clusterId: string, query?: Record<string, unknown>) => api.get<PageResult<WorkloadPod>>(`${admin}/clusters/${clusterId}/pods`, query),
  deployments: (clusterId: string, query?: Record<string, unknown>) => api.get<PageResult<Deployment>>(`${admin}/clusters/${clusterId}/deployments`, query),
  migrationPlans: (query?: Record<string, unknown>) => api.get<PageResult<MigrationPlan>>(`${admin}/migration/plans`, query),
  migrationTasks: (query?: Record<string, unknown>) => api.get<PageResult<MigrationPlan>>(`${admin}/migration/tasks`, query),
  alertRules: (query?: Record<string, unknown>) => api.get<PageResult<AlertRule>>(`${admin}/alerts/rules`, query),
  alertEvents: (query?: Record<string, unknown>) => api.get<PageResult<AlertEvent>>(`${admin}/alerts/events`, query),
  auditLogs: (query?: Record<string, unknown>) => api.get<PageResult<AuditLog>>(`${admin}/audit/logs`, query),
};
