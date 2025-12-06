# 项目技术约定

## 技术栈
- **核心:** Angular 18 / TypeScript 5 / Cytoscape

## 开发约定
- **组件模式:** 独立组件+特性模块分层
- **样式:** SCSS，优先使用 Bootstrap 5 现有变量
- **命名:** 文件名使用 kebab-case，类/组件使用帕斯卡命名

## 错误与日志
- **策略:** 浏览器端使用 console 警告/错误，后续可接入远程日志
- **日志级别:** error > warn > info，调试阶段可保留 console.log

## 测试与流程
- **测试:** 优先补充组件单测与 e2e 待规划
- **提交:** 建议遵循 Conventional Commits，如 `feat: add tree list page`
