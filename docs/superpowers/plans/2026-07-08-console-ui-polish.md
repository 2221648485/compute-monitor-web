# Console UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化控制台 NVIDIA 风格、集群纳管、新增集群上传、节点/GPU 滚动区、工作负载服务端搜索与分页，并提交到 GitHub。

**Architecture:** 前端继续使用 Vue 3 + TypeScript + Vite。接口层只补真实后端已存在的字段和上传方法，页面状态保留在视图组件内，通用提示使用全局 Toast。

**Tech Stack:** Vue 3, TypeScript, Vite, lucide-vue-next, Docker, Nginx。

---

### Task 1: 设计约束与基础样式

**Files:**
- Create: `DESIGN.md`
- Modify: `src/styles/main.css`

- [ ] 写入 NVIDIA 风格约束：黑白灰、`#76b900` 主色、2px 圆角、细线表格、无渐变。
- [ ] 调整卡片、表格、分页、搜索框、滚动容器样式。
- [ ] 保留中文注释，说明关键交互意图。

### Task 2: 接口层

**Files:**
- Modify: `src/api/monitor.ts`
- Modify: `src/api/types.ts`

- [ ] 为集群上传新增 `uploadCluster(FormData)`。
- [ ] 为 Pod/Deployment 查询保留 `keyword`、`page`、`size` 参数透传。
- [ ] 类型中补充 `api_server` 和分页字段使用需要。

### Task 3: 集群纳管页面

**Files:**
- Modify: `src/views/ClustersView.vue`

- [ ] 修复 UTF-8 中文文案。
- [ ] 宽卡片展示：集群名称突出、ID 辅助显示、信息区留足行高。
- [ ] 新增集群支持 JSON 表单和 kubeconfig 上传两种方式。
- [ ] 增加集群 keyword/status 筛选，调用后端分页筛选接口。

### Task 4: 节点/GPU 页面

**Files:**
- Modify: `src/views/NodeGpuView.vue`

- [ ] 修复 UTF-8 中文文案。
- [ ] Nodes、GPU 使用率、节点清单都使用内部滚动区。
- [ ] 表头统一英文。

### Task 5: 工作负载页面

**Files:**
- Modify: `src/views/WorkloadsView.vue`

- [ ] 修复 UTF-8 中文文案。
- [ ] Pod 搜索 label 和输入框保持同一行。
- [ ] 使用后端 `keyword` 字段做服务端搜索。
- [ ] 使用后端分页结果做上一页/下一页/每页数量。
- [ ] 移除表格下方 Running 状态胶囊。
- [ ] 表头统一英文。

### Task 6: 验证与发布

**Files:**
- Modify: generated build output only through normal commands.

- [ ] 运行 `npm run build`。
- [ ] 运行 `build.bat 0.1.4`。
- [ ] 临时 Docker 容器访问返回 200。
- [ ] `git diff` 检查范围。
- [ ] 使用中文 Conventional Commit：`feat: 优化控制台页面样式与工作负载分页`。
- [ ] 推送到 `origin/main`。
