# Compute Monitor Console Design

参考方向：VoltAgent/awesome-design-md 中的 NVIDIA DESIGN.md。选择理由是项目本身围绕 GPU、Kubernetes 和算力资源，适合工程化、低装饰、数据密集的界面，而不是营销页或柔和 SaaS 风。

## Visual Rules

- 黑白灰作为主结构，`#76b900` 只用于主按钮、当前导航、关键状态和角标。
- 所有卡片、按钮、输入框使用 2px radius，避免大圆角、渐变和装饰性阴影。
- 页面以高密度运维信息为主：表格、资源卡、状态标签、负载条优先。
- 不做接口清单页，不把后端模块数量当作产品功能展示。
- 组件分隔使用 1px hairline border，不使用漂浮卡片和多层卡片嵌套。
- 字体使用 Inter/Arial fallback，字重 400/700，字距为 0。

## Product Tone

这是研究和演示场景中的算力监控控制台。界面应当像工程仪表盘：冷静、精确、可扫读。视觉强调只服务状态判断和操作路径。
