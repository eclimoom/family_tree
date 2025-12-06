# 技术设计: 族谱列表与个人中心

## 技术方案
### 核心技术
- Angular 18 独立组件 + 特性模块 (Feature Modules)
- Angular Router 分层：Shell 布局 + 子路由
- Bootstrap 5 样式复用
- 前端内存数据服务模拟后端（后续可替换）

### 实现要点
- 新建特性模块 `genealogy`（族谱详情）、`tree-list`（族谱列表）、`profile`（我的）。
- 调整 `app.routes.ts`：根路径重定向到 `/trees`; `/trees` 列表；`/trees/:id` 详情；`/me` 个人中心。
- `AppComponent` 仅保留 shell 布局与 `<router-outlet>`，族谱详情页面迁移到 `GenealogyPageComponent`。
- 创建 `TreeListComponent`：展示 mock 族谱集合，可新增族谱（名称必填），点击跳转详情。
- 新建轻量数据服务 `GenealogyStoreService`：维护族谱集合与当前族谱数据，封装加载/新增/获取逻辑。
- “我的”页面 `ProfileComponent`：展示用户概要（ID=9527 占位）和操作卡片（历史/创建/导入占位）。
- 样式：复用现有 SCSS 变量，避免内联样式，适当拆分全局样式与特性样式。

## 架构设计
- Shell 布局组件: 顶部导航 + 主内容区。
- 路由层次:
  - `/trees` -> TreeListComponent
  - `/trees/:id` -> GenealogyPageComponent (包含现有 Cytoscape 视图)
  - `/me` -> ProfileComponent
  - `**` -> 重定向 `/trees`

## 架构决策 ADR
### ADR-001: 路由分层与特性模块化
**上下文:** 当前所有 UI 聚合在 `AppComponent`，无路由分层；需新增列表与我的页面。
**决策:** 引入 shell + feature modules；使用独立组件+提供者，让每个页面按路由惰性加载或直接导入。
**理由:** 提高可维护性，符合 Angular 最佳实践，便于未来扩展（如守卫、懒加载）。
**替代方案:** 继续在单组件内用 tabs/条件渲染；拒绝原因：状态臃肿、路由不可分享。
**影响:** 需要重构导航与容器层；现有 Cytoscape 代码迁移到详情页组件。

## API设计
- 暂不接入后端；数据服务提供 `listTrees()`, `getTree(id)`, `createTree(name)` 方法。

## 数据模型
```ts
interface Genealogy {
  id: string;
  name: string;
  nodes: Person[];
  edges: any[];
}
```

## 安全与性能
- 数据仅内存存储，无持久化；后续接入后端需加鉴权。
- Cytoscape 渲染保持现有性能配置。

## 测试与部署
- 单测优先覆盖 `GenealogyStoreService` 的新增/获取逻辑。
- 手动验证路由跳转与 Cytoscape 渲染。
