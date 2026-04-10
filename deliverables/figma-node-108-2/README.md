# Figma 转换结果（Node 108:2）

来源：
- 文件链接：`https://www.figma.com/design/gPfXNUAzgtr6klT3ik7JSQ/A2A-Pixelium-%E2%80%94-Design-System?node-id=108-2&m=dev`
- 节点：`108:2`

## 已生成文件

- `GenerateDesignSystemFile.tsx`
  - 可编辑 React 组件源码（由 Figma MCP 生成）
  - 资源引用已从 `http://localhost:3845/assets/...` 重写为本地 `./assets/...`
- `assets/`
  - 共 225 个 SVG 资源，已本地化
- `screenshot-node-108-2.png`
  - 节点截图（用于视觉对照）
- `design_context.json`
  - MCP 原始设计上下文返回
- `metadata.json`
  - MCP 原始节点结构元数据
- `screenshot.json`
  - MCP 原始截图数据
- `variable_defs.json`
  - MCP 变量定义返回（本节点返回 `{}`）

## 说明

- 这是“可编辑源码”形态，已可直接改 TSX 与资源文件。
- 该组件源码包含大量 Tailwind class。你当前项目默认不是 Tailwind 渲染链路，因此直接挂载时样式不会 1:1 呈现。
- 若要做到 1:1 视觉还原，需要下一步把 class 转为你项目现有 CSS 体系（建议拆分为 tokens + 基础组件 + 页面样式三层）。

## 在项目中临时挂载（可选）

1. 将 `GenerateDesignSystemFile.tsx` 放入 `apps/web/src/pages/`。
2. 在路由中新增一个开发路径（例如 `/figma-ds`）挂载该组件。
3. 再逐步做样式迁移。
