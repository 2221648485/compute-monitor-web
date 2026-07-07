# Compute Monitor Console

Vue3 + Vite 前端，用于对接 `compute-monitor-api` 的真实 `/api/admin` 接口。

## 运行

```powershell
npm install
npm run dev
```

默认开发地址：`http://localhost:5174`

开发服务器会把 `/api` 和 `/healthz` 代理到 `http://localhost:8080`。如果后端不在本机 8080，可设置：

```powershell
$env:VITE_API_BASE = "http://你的后端地址:8080"
npm run dev
```

## 页面

- 登录：调用 `/api/admin/auth/login` 和 `/api/admin/auth/me`
- 总览：调用集群、资源概览、算力资源、GPU 汇总接口
- 集群：展示集群配置，支持连接测试和 K8s 同步
- 节点/GPU：展示节点清单与 GPU 遥测
- 工作负载：展示 Pod 和 Deployment
- 迁移：展示迁移计划和任务
- 告警审计：展示告警事件、规则和审计日志
- 用户/RBAC：接入真实用户管理接口，支持用户列表、新增、编辑、启停和重置密码。当前后端不是完整 RBAC，只支持 `admin/operator/viewer` 单角色字段，业务接口仍主要是 admin-only。

前端不使用 mock 数据。

## Docker 打包

Windows 下执行：

```powershell
.\build.bat
```

也可以指定镜像标签：

```powershell
.\build.bat 0.1.0
```

脚本会构建镜像并导出：

```text
releases/compute-monitor-console_0.1.0.tar
```

虚拟机上加载并运行：

```bash
docker load -i compute-monitor-console_0.1.0.tar
docker run -d --name compute-monitor-console \
  -p 80:80 \
  -e BACKEND_URL=http://后端主机或容器名:8080 \
  compute-monitor-console:0.1.0
```

生产或虚拟机环境必须显式设置 `BACKEND_URL`。默认的 `host.docker.internal` 在很多 Linux Docker Engine 上不可用。

后端在宿主机上运行时可使用：

```bash
docker run -d --name compute-monitor-console \
  --add-host=host.docker.internal:host-gateway \
  -p 80:80 \
  -e BACKEND_URL=http://host.docker.internal:8080 \
  compute-monitor-console:0.1.0
```

如果前端和后端都在同一台虚拟机的 Docker 中运行，建议把它们放进同一个 Docker network，然后把 `BACKEND_URL` 写成后端容器服务名，例如 `http://compute-monitor-api:8080`。

新增集群时要注意：

- `kubeconfig_path` 是后端进程能访问到的路径，不是前端容器内路径。
- 如果后端也在容器里运行，需要把 kubeconfig 所在目录挂载到后端容器中。
- `prometheus_url` 也必须从后端运行环境可访问。
- 首次创建集群后建议按顺序执行：创建集群、测试连接、同步资源、查看节点/GPU、查看工作负载。

部署后验证清单：

```text
1. 打开前端页面
2. 登录 admin
3. 确认 /healthz 代理正常
4. 创建集群
5. 测试连接
6. 同步资源
7. 查看节点/GPU
8. 查看 Pod/Deployment
9. 查看用户/RBAC 页面
```
