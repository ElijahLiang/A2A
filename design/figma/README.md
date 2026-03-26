# A2A × Figma 设计系统

本目录把 **`apps/web` 里已实现的设计令牌与美术路径** 结构化，便于在 Figma 中建立 **Variables（变量）**、**组件库** 并与工程对齐。

> 说明：无法代你登录 Figma。按下面步骤本地导入即可「连接」仓库与 Figma。

## 1. 文件说明

| 文件 | 用途 |
|------|------|
| `tokens.tokens.json` | 颜色、间距、字号、字体族、动效时长等；可导入 **Tokens Studio for Figma** |
| `assets-manifest.json` | 与代码一致的美术路径清单 + 建议 Figma 页面结构 |

工程内 CSS 真源：`apps/web/src/styles/global.css`、`apps/web/src/styles/components.css`。

## 2. 在 Figma 中导入设计令牌（推荐 Tokens Studio）

1. 在 Figma 安装插件 **Tokens Studio for Figma**（原 Figma Tokens）。
2. 打开插件 → **Load from file** / **Import** → 选择本目录下的 `tokens.tokens.json`。
3. 按插件指引将 token **Push to Figma**，生成 **Color / Number** 等变量（字体族可再手动建成 **Text style** 的基底）。
4. 在 Figma **Variables** 面板中确认两套逻辑：
   - **Core**：`px-teal`、`px-paper`、`map.*` 等原始色板。
   - **Semantic**：`color/primary` 等引用 core（与 CSS `--color-primary` 一致）。

若插件解析别名 `{core.color...}` 报错，可在 Tokens Studio 内先只导入 `core` 分组，再手动把 semantic 绑到变量引用。

## 3. 把美术资产挂进 Figma

1. 在仓库中找到实际文件目录：`apps/web/public/`（与 `assets-manifest.json` 中的路径对应）。
2. 在 Figma 新建页面 **01 Assets Raster**：将 `map-bg.png`、`boot-*.png`、各 `buildings/*.png` **拖入画布**。
3. 为每个建筑创建 **Component**，命名与 `BuildingId` 一致，例如 `Building / library`，便于和 `Building.tsx` 对照。
4. 新建 **02 Assets Sprites**：
   - 为 `body / shoes / pants / shirt / hair-* / hat-*` 各建 Component。
   - 用 **Instance 叠加** 拼出 `Mira / Kai / Luca / Yuki / Player`，与 `agents.ts` 的 `layers` 顺序一致（底→顶）。

## 4. 布局与栅格

- **小镇画布**：**1200 × 780 px**（对应 `--map-width` / `--map-height`）。
- **像素 UI**：以 **4px** 为基准（`--px-bit`）；描边常用 **3–4px**（`--border-base` / `--border-thick`）。

### 图层顺序（对应 CSS `--z-*`，Figma 用置顶顺序实现）

| 层级 | 变量 | 建议 |
|------|------|------|
| 地图 | `--z-map` | 最底 |
| 工具栏 / 扫描线 | `--z-toolbar` / `--z-scanline` | 高于地图 |
| 遮罩 | `--z-overlay` | 对话框下或上视交互而定 |
| 弹窗 | `--z-modal` | 高于遮罩 |
| 信件层 | `--z-letter` | 最高 |

## 5. UI 组件（与代码类名对齐）

在 Figma 中建议建立组件前缀 **`Pixel /`**，对应 `components.css`：

- `Pixel / Button / Primary|Secondary|Danger|Small`
- `Pixel / Input`、`Pixel / Textarea`、`Pixel / Label`
- `Pixel / Badge`（绿/橙/蓝/紫/红/青变体）
- `Pixel / Card`、`Pixel / Progress`
- `Pixel / Avatar`、`Pixel / Avatar Large`

填充与描边绑定 **Semantic** 变量，而不是直接吸色，以便以后改主题。

## 6. 字体

HTML 已加载：`Noto Sans SC`、`Press Start 2P`、**Zpix**（见 `apps/web/index.html`）。

建议在 Figma：

- **Text style「Body」**：Noto Sans SC，正文字号可用 12 / 14 / 16。
- **Text style「Pixel / UI」**：Zpix 或 Press Start 2P，用于按钮、标签、气泡标题；与 CSS `--font-pixel` 使用场景一致。

## 7. 与代码同步流程（建议）

1. 设计改色：先改 Figma Variables → 导出/同步 token → 再合并到 `global.css` 的 `:root`（或未来用脚本从 JSON 生成 CSS）。
2. 新建筑或新 sprite：先加入 `public/`，再更新 `assets-manifest.json` 与 `Building.tsx` / `agents.ts`。

---

## 8. 线上设计系统文件（MCP 维护）

团队已在 Figma 中创建并持续维护文件（与本文档、`global.css` 对齐）：

- [A2A Pixelium — Design System](https://www.figma.com/design/gPfXNUAzgtr6klT3ik7JSQ)

**用户流程图（交互）**

- 页面 **`14 · User Flow`**：`design/user-flow.html` 中的主流程、发布、会面、参加、信件说明，已用 **Pixelium** 色板与 3px 描边节点重绘，便于与研发对照。
- **中文可读性**：流程标题等若曾用 `Press Start 2P` 会与中文不兼容（字形缺失看似「丢字」）。该页已统一为 **中文 → Noto Sans SC（Bold/Regular）**，箭头与过小字号已加大；产品标题等纯英文仍可用像素字体。

**近期完善项（相对初版）**

- 变量：`surface/panel-muted`、`color/panel-muted`（对齐 `--color-panel-muted`）。
- 文档页：`02 · Typography`、`03 · Spacing` 规格示意。
- 画布：`09 · Town Map Screen` 内 **1200×780** 地图框 + 80px 网格说明。
- 组件：`Progress`、`Avatar`（几何占位）、`Textarea`、`MapToolbar`（内含 `Button` 实例）。
- 注意：文件中可能存在 **两个同名 `Borders` 变量集合**（历史重复创建）；合并前请确认引用后再删其一。

**命名约定**：Figma 组件与变量名尽量与代码中的 `BuildingId`、`CSS 变量名`（去掉 `--`）一致，可减少沟通成本。
