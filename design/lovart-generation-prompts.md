# A2A Pixelium · Lovart 生成提示词包

> 用途：将下列 **全局前缀** 与各资源的 **提示词** 复制到 Lovart（或同类 AI 绘图工具）中生成美术资源。  
> 项目：A2A 像素小镇社交 · 风格代号 **Pixelium**（暖纸色 + 青绿主色 + 粗描边）。

---

## 使用方式

1. 每次生成先粘贴 **§1 全局风格前缀**（中英文任选其一或组合）。  
2. 再粘贴对应资源的 **主提示词**。  
3. 需要时追加 **负面提示词** 减少跑题。  
4. 导出：**PNG**、**透明背景**（角色/图标/UI），建筑/地图可与背景一体时再定。

---

## 1. 全局风格前缀（必贴）

### 中文前缀

```
像素艺术，16-bit 或 32×32 网格感，清晰硬边，无抗锯齿模糊；
配色：暖米白纸张感背景、主色青绿色（teal #2c968b 系）、深褐墨色描边 #2b2723；
粗描边约 2–4 像素，扁平色块，轻微纸质纹理可接受但不要照片写实；
游戏 UI 资产，正交视角或轻微等距，可爱但不低幼，适合大学生社交小镇主题；
禁止：写实照片、3D 渲染、渐变光晕、细线矢量插画、水印、文字乱码。
```

### English prefix (paste with Chinese or alone)

```
Pixel art, crisp edges, 16-bit retro game asset style, no anti-alias blur;
palette: warm paper cream #f3f0e8, teal accent #2c968b, dark brown ink outline #2b2723;
thick 2–4px outline, flat colors, subtle paper grain OK, not photorealistic;
orthographic or slight isometric, cozy campus town, young adult social game;
avoid: photorealism, 3D render, heavy gradients, thin line art, watermark, gibberish text.
```

### 负面提示词（通用，可选）

```
photorealistic, 3d render, anime face detail, soft airbrush, lens flare,
blurry, jpeg artifacts, watermark, signature, english text, logo
```

---

## 2. 地图与场景底图

### 2.1 小镇地图背景 `map-bg.png`

- **尺寸建议**：2400×1560（2× 逻辑 1200×780）或 1200×780  
- **主提示词**：

```
俯视角像素小镇草地地图，浅绿草地色块 #b9dc86 #8dc45b，土黄色小路 #d8c78d，
远处可有浅蓝水池色块，无建筑细节或仅远处剪影，留出中央大空地放置建筑，
整体像 RPG 小镇野外地图，无缝感弱可接受，粗描边，Pixelium 配色。
```

```
Top-down pixel art town map background, grass tiles in light green and lime,
beige dirt paths, small pond area in blue-green, empty center for buildings,
retro SNES style, thick outlines, warm paper + teal accents in UI areas only if needed.
```

### 2.2 开机背景 `boot-bg.png` + 门 `boot-door.png`

**背景**

```
深色夜空像素背景 #0a0a0c 带稀疏星点，底部远处青绿色 glow 暗示小镇，
中间留白给 Logo 与门，粗像素星星，无文字。
```

**门（透明底单独一张）**

```
像素艺术双开木门，暖木色，门缝透出青绿色光 #51b7a9，粗描边，
正面平视，对称，可带简单门环，透明背景 PNG。
```

---

## 3. 建筑贴图（9 张，`/buildings/*.png`）

**共用后缀**（每张建筑名前加全局前缀 + 下面一句）：

```
等距或微俯视像素小建筑，单栋完整立绘，透明背景，
约 120–200 像素宽，粗描边，屋顶可用橙红 #d86f49，墙米黄 #f5e9cf，
不要地面阴影条以外的杂景。
```

| 建筑 ID | 中文提示词补充 |
|---------|----------------|
| library | 校园图书馆，书窗，小台阶 |
| post_office | 邮局，邮箱装饰，小旗 |
| restaurant | 小餐馆，烟囱，暖灯窗 |
| town_square | 广场喷泉或纪念碑，开阔 |
| cafe | 咖啡馆，遮阳篷，咖啡杯招牌剪影 |
| gym | 体育馆，弧形顶，运动感 |
| cinema | 小电影院，票窗条纹 |
| arcade | 街机厅，霓虹色块点缀（仍像素扁平） |
| home | 温馨小房子，烟囱，门廊 |

---

## 4. 角色精灵分层（`/sprites/*.png`）

**规则**：统一 **48×48** 或 **64×64** 画布，脚底对齐画布底边，透明底。

**每层一张 PNG**（命名与工程一致）：

| 文件 | 提示词要点 |
|------|------------|
| body.png | 像素裸模肤色上衣简化躯干，无头无脚，粗描边 |
| shoes.png | 像素鞋子一层，左右对称 |
| pants.png | 像素裤子 |
| shirt.png | 像素上衣 |
| hair-bob.png | 短发 bob 发型，覆盖头顶 |
| hair-dapper.png | 侧分绅士短发 |
| hat-cowboy.png | 牛仔帽，可略大于头宽 |

**蓝 / 绿小人（形象选择）**：在上述基础上各出一套 `shirt` 或 `body` 染色版——

```
同一角色剪影，仅上衣主色改为饱和蓝色 #5c9ad6 或草绿色 #87bc53，其余层不变风格。
```

---

## 5. 交互事件专用资源（对照 interaction-events）

### 5.1 邮箱 Mailbox

```
像素 UI 图标，邮箱两种状态同一视角：开口空箱（无信）、闭口有信（可带小信封角），

32×32 与 64×64 各一版可选，粗描边，透明背景，teal 点缀，纸色箱体。
```

### 5.2 信封与撕信（手势）

```
像素信封正面，封口三角形；再要「半撕开」一帧：封口翘起露白纸边；
粗描边，透明背景，暖牛皮纸色 #e8d5a8，边线深褐 #8b6914。
```

### 5.3 印章与寄出

```
圆形像素印章图案，中心简单星形或「A2A」抽象符号（不要清晰可读英文），
朱红或 teal 双色稿；另要一枚小「飞信封」侧视剪影用于动效占位。
```

### 5.4 广场猫（多只）

```
Q 版像素猫，站立，透明背景，64×64，共 3 种配色剪影区分：
灰条纹、橘色、黑白，同一风格粗描边，适合点击展示活动类型。
```

### 5.5 许愿池

```
像素许愿池，圆形石砌边，中心水光蓝绿色块，无人物，
俯视角或斜 45°，粗描边，可单独切 UI 按钮状态高亮外框。
```

### 5.6 引导吉祥物

```
像素四足小动物或圆润机器人，非人类，配色 teal + 纸白，

待机 pose 一帧，粗描边，透明背景，96×96，可爱导师感。
```

### 5.7 握手 / 纪念戳 / 合影框

```
两个 Q 像素小人侧身握手剪影，粗描边，透明背景，128×64 横图；

像素圆形纪念章边框，内留白给程序写字，麦穗或星星装饰；

像素相框，粗白边，角上小闪光星，横版 240×160 左右。
```

### 5.8 Token 图标

```
像素游戏货币图标，小圆币，中心简单菱形或叶子符号，teal + 金边 #d8b04f，

32×32 透明背景，扁平无渐变。
```

---

## 6. UI 皮肤（可与 Figma 组件对齐后导出）

```
像素风 UI 面板角，L 形双边框，外深褐 3px 内浅线，填充区纸白 #fcfcf8，
直角无圆角，适合半屏底部表单背景条 1200×400 可九宫格切图。
```

---

## 7. 交给 Lovart 的一句话任务描述（整包）

若 Lovart 支持「项目简述」，可粘贴：

```
为「A2A 像素小镇」社交游戏生成一套统一 Pixelium 风格的 2D 像素素材：
地图底图、9 栋建筑、角色换装分层精灵、开机门与夜空、

邮箱开闭、信封与撕口、印章、三只不同花色的猫、许愿池、引导吉祥物、

握手与纪念章与相框、Token 小图标。全部粗描边、透明底 PNG、禁止写实与 3D。
```

---

## 8. 与工程路径对照（交付时命名）

| Lovart 产出 | 放入仓库路径 |
|-------------|----------------|
| 地图 | `apps/web/public/map-bg.png` |
| 开机 | `apps/web/public/boot-bg.png`、`boot-door.png` |
| 建筑 | `apps/web/public/buildings/<id>.png` |
| 角色层 | `apps/web/public/sprites/<name>.png` |
| 新交互图 | 建议 `apps/web/public/ui/` 下再分子目录 `mailbox/`、`letter/` 等，再在代码中引用 |

---

*文档版本：与 `design/interaction-events.md`、`design/figma/assets-manifest.json` 及 `apps/web/src/styles/global.css` 色板对齐。*
