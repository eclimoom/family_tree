# 任务清单: 族谱列表与个人中心

目录: `helloagents/plan/202512061046_genealogy_nav/`

---

## 1. 路由与架构
- [ ] 1.1 重构 `src/app/app.routes.ts`，添加 `/trees`, `/trees/:id`, `/me` 路由，默认重定向 `/trees`，验证 why.md#需求-浏览族谱列表-场景-选择族谱
- [ ] 1.2 调整 `AppComponent` 为 shell 布局，仅保留导航+`<router-outlet>`，迁移族谱视图至特性页面，验证 why.md#需求-浏览族谱列表-场景-选择族谱

## 2. 族谱详情(Genealogy)
- [ ] 2.1 创建 `GenealogyPageComponent`（独立组件）承载现有 Cytoscape 逻辑，确保样式与功能平移，验证 why.md#需求-浏览族谱列表-场景-选择族谱

## 3. 族谱列表(TreeList)
- [ ] 3.1 创建 `TreeListComponent` 展示族谱列表，使用列表卡片显示名称/成员数，点击跳转详情，验证 why.md#需求-浏览族谱列表-场景-选择族谱
- [ ] 3.2 创建“新建族谱”表单（名称必填），提交后写入内存列表并可立即跳转，验证 why.md#需求-创建族谱-场景-新建族谱

## 4. 数据服务
- [ ] 4.1 实现 `GenealogyStoreService` 管理族谱集合：初始化 mock 数据、支持 `listTrees/getTree/createTree`，验证 why.md#需求-创建族谱-场景-新建族谱

## 5. 我的(Profile)
- [ ] 5.1 创建 `ProfileComponent` 展示用户概要与操作占位（历史/创建/导入），验证 why.md#需求-我的入口-场景-查看我的

## 6. 样式与资源
- [ ] 6.1 整理导航与页面布局 SCSS，确保 Cytoscape 容器尺寸正确，验证 why.md#需求-浏览族谱列表-场景-选择族谱

## 7. 文档与版本
- [ ] 7.1 更新 `helloagents/wiki/modules/*.md` 对应模块状态与规范
- [ ] 7.2 更新 `helloagents/CHANGELOG.md` 版本条目

## 8. 测试
- [ ] 8.1 为 `GenealogyStoreService` 添加基本单元测试覆盖创建/查询
- [ ] 8.2 手动回归：路由跳转、Cytoscape 渲染、列表新增显示
