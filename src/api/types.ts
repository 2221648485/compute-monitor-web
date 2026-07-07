export type ApiBody<T> = {
  code: number;
  message: string;
  data?: T;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type User = {
  id: number;
  username: string;
  display_name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role: string;
  status: number;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  display_name: string;
  email?: string;
  phone?: string;
  role: string;
  status: number;
};

export type UpdateUserRequest = {
  display_name: string;
  email?: string;
  phone?: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: User;
};

export type Cluster = {
  id: string;
  name: string;
  status?: string;
  description?: string;
  kubeconfig_path?: string;
  prometheus_url?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateClusterRequest = {
  id: string;
  name: string;
  kubeconfig_path?: string;
  prometheus_url?: string;
  description?: string;
  status?: string;
};

export type UpdateClusterRequest = Omit<CreateClusterRequest, 'id'>;

export type Capacity = {
  cpuCore: number;
  memoryGB: number;
  gpuCount: number;
  gpuMemoryGB: number;
  availableCPU: number;
  availableGPU: number;
};

export type Utilization = {
  cpuPercent: number;
  memoryPercent: number;
  gpuPercent: number;
};

export type ComputeNodeResource = {
  clusterId: string;
  nodeName: string;
  internalIP: string;
  status: string;
  capacity: Capacity;
  utilization: Utilization;
  updatedAt: string;
};

export type ComputeResource = {
  clusterId: string;
  nodes: ComputeNodeResource[];
  summary: Capacity;
  source: string;
};

export type ResourceOverview = {
  generatedAt: string;
  clusters: Array<{
    clusterId: string;
    compute: Capacity;
    network: { averageLatencyMs: number; averageAvailableMbps: number };
    storage: { capacityGB: number; availableGB: number };
    energy: { averageGreenEnergyRatio: number; averageCarbonIntensity: number };
  }>;
};

export type NodeItem = {
  name: string;
  internalIP: string;
  status: string;
  roles: string[];
  cpuCapacity: number;
  memoryCapacityBytes: number;
  gpuCount: number;
  osImage?: string;
  kernelVersion?: string;
  containerRuntime?: string;
};

export type GPUItem = {
  nodeName: string;
  gpuIndex: number;
  gpuUUID: string;
  utilization: number;
  memoryUsageRate: number;
  temperature: number;
};

export type GPUSummary = {
  clusterId: string;
  total: number;
  source: string;
};

export type WorkloadPod = {
  name: string;
  namespace: string;
  nodeName: string;
  phase: string;
  podIP: string;
  hostIP: string;
  restartCount: number;
};

export type Deployment = {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  labels: Record<string, string>;
};

export type MigrationPlan = {
  id?: number | string;
  planId?: string;
  name?: string;
  status?: string;
  sourceClusterId?: string;
  targetClusterId?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type AlertRule = {
  id?: number | string;
  name?: string;
  metric?: string;
  level?: string;
  enabled?: boolean;
  status?: string;
  [key: string]: unknown;
};

export type AlertEvent = {
  id?: number | string;
  title?: string;
  message?: string;
  level?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type AuditLog = {
  id?: number | string;
  operator?: string;
  action?: string;
  resource?: string;
  createdAt?: string;
  [key: string]: unknown;
};
