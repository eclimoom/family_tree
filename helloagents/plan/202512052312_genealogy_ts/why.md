# 变更提案: genealogy_ts 迁移

## 需求背景
将已有仓库 /Users/junjihe/Dev/self/genealogy/src/js/app.js 的 Cytoscape 族谱布局与交互迁移到当前 Angular(18) 项目，采用 TypeScript 实现，保持布局与交互一致。

## 变更内容
1. 将 Cytoscape 族谱初始化与事件逻辑移植为 TS 版本并挂载到 Angular 组件。
2. 整理 mock 数据，放置到项目 `src/mock` 目录并供组件加载。
3. 确保头像等静态资源可用，修复迁移后发现的逻辑或类型问题。

## 影响范围
- 模块: 前端可视化族谱模块
- 文件: src/app/app.component.ts, src/app/genealogy-layout.ts, src/mock/data.json, 资源文件
- API: 无后端接口改动
- 数据: 仅前端 mock 数据

## 核心场景
### 需求: 族谱可视化展示
**模块:** 族谱
用户打开页面，看到族谱节点按辈分布局，夫妻并排，父子连线清晰。

#### 场景: 点击节点查看信息
- 用户点击任意人物节点
- 左侧面板显示姓名、性别、出生/住址与存亡状态

#### 场景: 拖拽复合节点
- 拖拽夫妻组成员时，整体夫妻组随之移动且内部左右排布保持

## 风险评估
- 风险: 资产路径或 bundler 配置不一致导致头像丢失
- 缓解: 使用 TS 资源声明并放置到 Angular 资产路径，页面手动验证
