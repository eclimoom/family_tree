# 技术设计: genealogy_ts 迁移

## 技术方案
### 核心技术
- Cytoscape + cytoscape-dagre (现有依赖)
- Angular 18 + TypeScript 严格模式

### 实现要点
- 将 app.js 逻辑整合到 `app.component.ts`，使用现有 `genealogy-layout.ts` 提供的变换与布局。
- 统一资源导入：male/female 头像通过 `src/assets` 或 `public` 提供，TS 声明模块。
- 事件处理改用原生 DOM 与 Cytoscape 事件，保持单选、高亮与拖拽逻辑。

## 架构设计
- 前端单页，无新增后端交互；布局与数据封装在组件内。

## 安全与性能
- 无外部输入，保持只读 mock 数据；避免不必要的重渲染。

## 测试与部署
- 手动跑 `ng serve` 观察族谱渲染与点击/拖拽行为（需 Node >=18.19）。
