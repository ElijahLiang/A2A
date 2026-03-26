# A2A UI 交互细节规范

> 本文档是 Cursor Composer 的补充输入，描述关键交互的视觉表现、动画时序、状态机和布局尺寸。
> 所有 CSS 值必须使用 `global.css` 中的 Token 变量。

---

## 一、信封盖章 & 寄出动画

> 触发点：IntentDialog 长按确认发布后

### 1.1 当前实现（已有）

- `phase: 'sending'` 时显示 SVG 信封 + A2A 印戳
- `@keyframes stamp-seal`：印戳从 scale(0) → scale(1)，200ms steps
- `@keyframes letter-flyout`：信封飞向右上角消失，850ms steps
- 已有 `intent-envelope-stage` / `intent-stamp` 等 CSS 类

### 1.2 需补充的细节

**盖章动画增强 — 三阶段时序：**

```
阶段1: 信封滑入 (0~300ms)
  ┌─────────────────────────────────────┐
  │  信封从画面底部滑入到正中央             │
  │  transform: translateY(120%) → translateY(0) │
  │  ease: steps(4, end)                │
  │  同时半透明遮罩淡入                   │
  └─────────────────────────────────────┘
          ↓
阶段2: 盖章 (300ms~600ms)
  ┌─────────────────────────────────────┐
  │  印戳从大到小"砸下来"                 │
  │  transform: scale(2.5) rotate(-18deg)│
  │     → scale(1) rotate(0deg)         │
  │  同时播放一个红色圆形扩散光效:          │
  │     opacity 1→0, scale 1→2          │
  │  信封轻微下沉 2px 后弹回（受力感）     │
  │  ease: steps(3, end) — 像素碰撞感    │
  └─────────────────────────────────────┘
          ↓
阶段3: 飞出 (600ms~1400ms)
  ┌─────────────────────────────────────┐
  │  信封向右上角飞出                     │
  │  路径：贝塞尔曲线，不是直线             │
  │  translate(0,0) → translate(120%, -110%) │
  │  同时 rotate(0) → rotate(12deg)      │
  │  信封越小越透明                       │
  │  飞出后留下 3~4 个像素星星粒子         │
  │  粒子 400ms 后消失                   │
  └─────────────────────────────────────┘
```

**新增 @keyframes（加到 global.css）：**

```css
@keyframes envelope-slide-in {
  from { opacity: 0; transform: translateY(120%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes stamp-impact {
  0%   { transform: scale(2.5) rotate(-18deg); opacity: 0; }
  60%  { transform: scale(0.9) rotate(2deg);   opacity: 1; }
  100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
}

@keyframes stamp-shockwave {
  from { opacity: 0.6; transform: scale(0.5); }
  to   { opacity: 0;   transform: scale(2.2); }
}

@keyframes envelope-recoil {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(3px); }
  100% { transform: translateY(0); }
}

@keyframes star-particle {
  from { opacity: 1; transform: translate(0, 0) scale(1); }
  to   { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
}
```

**信封 SVG 规格：**

```
宽度: 200px   高度: 160px
信封主体: rect(14, 56, 172, 104)
信封盖:   polygon(14,56  100,18  186,56)
填充: var(--px-envelope) = #e8d5a8
描边: var(--px-envelope-border) = #8b6914, 4px

印戳:
  位置: 信封中心偏右上
  尺寸: 56×56px
  外框: 3px solid var(--color-danger-strong)
  背景: var(--color-danger) = 玫红
  文字: "A2A" 像素字体，白色
  旋转: 最终态 rotate(-6deg) — 盖歪一点更自然
```

### 1.3 布局约束

```
发布表单弹窗尺寸（组团信息界面只需半屏）:
  width: var(--dialog-width) = min(720px, 100vw - 32px)
  max-height: 50vh
  position: fixed; bottom: 0;
  border-radius: 0（像素风无圆角）
  从底部 slide-up 进入

信封动画遮罩:
  position: fixed; inset: 0;
  background: rgba(10, 12, 11, 0.42);
  z-index: var(--z-modal)
```

---

## 二、手撕信封交互

> 触发点：邮箱打开后，点击一封信进入信件详情

### 2.1 交互流程

```
状态1: 信封静态展示
  ┌────────────────────────────────────┐
  │         ╲          ╱               │  ← 信封盖（三角形 flap）
  │          ╲   邮戳 ╱                │
  │           ╲     ╱                  │
  │  ┌──────────────────────────────┐  │
  │  │                              │  │  ← 信封主体
  │  │    To: 你                    │  │
  │  │    From: [对方名字]           │  │
  │  │                              │  │
  │  └──────────────────────────────┘  │
  └────────────────────────────────────┘

         用户手指/鼠标按住信封盖向上拖拽
                     ↓

状态2: 拖拽中（实时跟手）
  ┌────────────────────────────────────┐
  │  信封盖随拖拽距离旋转 (rotateX)      │
  │  dragY: 0px → 80px                │
  │  flap rotation: 0deg → 180deg     │
  │                                    │
  │  当 dragY > 40px (50%) 时:          │
  │    信纸开始从信封内探出头             │
  │    translateY: 0 → -60px           │
  │                                    │
  │  松手时:                            │
  │    dragY > 80px → 触发撕开（进入状态3）│
  │    dragY ≤ 80px → 弹回关闭状态       │
  └────────────────────────────────────┘

                     ↓ (dragY > 80px 松手)

状态3: 撕开完成
  ┌────────────────────────────────────┐
  │  信封盖完全翻开 rotateX(180deg)     │
  │  信纸上升并展开:                     │
  │    translateY(-100px)              │
  │    信封主体下沉并透明化              │
  │                                    │
  │  信纸展开内容:                      │
  │  ┌────────────────────────────────┐│
  │  │ [Avatar] 对方名字    状态      ││ ← 左上角
  │  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─││
  │  │                                ││
  │  │  留言内容...                    ││ ← 中部，背景带心情色
  │  │                                ││
  │  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─││
  │  │  📅 今晚  📍 体育馆            ││ ← 底部时间地点
  │  │                                ││
  │  │  [回信]  [私聊]       ← 滑动丢弃││ ← 操作栏
  │  └────────────────────────────────┘│
  └────────────────────────────────────┘
```

### 2.2 实现细节

**Pointer 事件处理：**

```typescript
// 核心状态
const [dragY, setDragY] = useState(0)
const [isDragging, setIsDragging] = useState(false)
const [isOpened, setIsOpened] = useState(false)
const startY = useRef(0)

const THRESHOLD = 80  // 触发撕开的最小拖拽距离

onPointerDown(e) {
  startY.current = e.clientY
  setIsDragging(true)
  e.currentTarget.setPointerCapture(e.pointerId)
}

onPointerMove(e) {
  if (!isDragging) return
  const dy = Math.max(0, startY.current - e.clientY) // 只允许向上拖
  setDragY(Math.min(dy, 120))                        // 限制最大距离
}

onPointerUp() {
  setIsDragging(false)
  if (dragY >= THRESHOLD) {
    setIsOpened(true)  // 触发撕开
  } else {
    setDragY(0)        // 弹回
  }
}
```

**CSS 跟手映射：**

```css
.mail-envelope-flap {
  /* 3D 翻转 */
  transform-origin: top center;
  transform: rotateX(calc(var(--drag-progress) * 180deg));
  /* --drag-progress 由 JS 通过 style 属性传入，范围 0~1 */
  transition: transform 0.15s steps(2, end);
}

.mail-letter-paper {
  /* 信纸跟随探出 */
  transform: translateY(calc(var(--drag-progress) * -100px));
  opacity: var(--drag-progress);
  transition: transform 0.15s steps(2, end),
              opacity 0.1s steps(1, end);
}

/* 撕开成功后 */
.mail-letter--opened .mail-envelope-flap {
  transform: rotateX(180deg);
}

.mail-letter--opened .mail-envelope-body {
  opacity: 0;
  transform: translateY(60px) scale(0.85);
  transition: all var(--dur-slow) steps(3, end);
  pointer-events: none;
}

.mail-letter--opened .mail-letter-paper {
  transform: translateY(-100px);
  opacity: 1;
}
```

**信封拆分 DOM 结构：**

```
div.mail-letter-container   (perspective: 800px)
  ├── div.mail-envelope
  │     ├── div.mail-envelope-body       (信封主体，含收件人/发件人)
  │     ├── div.mail-envelope-flap       (三角形盖子，clip-path)
  │     └── div.mail-envelope-stamp      (右上角小邮票)
  │
  └── div.mail-letter-paper              (信纸内容，初始在信封后面)
        ├── div.mail-letter-header       (Avatar + 名字 + 关闭按钮)
        ├── div.mail-letter-divider      (虚线分隔)
        ├── div.mail-letter-body         (留言内容 + 心情色块)
        ├── div.mail-letter-meta         (时间 + 地点)
        └── div.mail-letter-actions      (回信 / 私聊 / 滑动丢弃)
```

### 2.3 信件内容布局

```
信纸尺寸:
  width: min(400px, 90vw)
  height: auto, max-height: 70vh
  background: var(--px-paper-0) — 暖白色

左上角 Avatar 区域:
  ┌──────────────────────────────┐
  │ [48×48 Avatar]  名字          │
  │                  身份介绍一句话 │
  └──────────────────────────────┘
  Avatar 边框: 2px solid var(--color-border)
  背景: var(--color-primary-soft)
  名字: font-pixel, var(--text-base), var(--px-teal-7)
  介绍: font-pixel, var(--text-xs), var(--color-text-muted)

中部留言区域:
  ┌──────────────────────────────┐
  │  padding: 14px                │
  │  左侧 4px 色带 = 对方心情色    │
  │  font-body, var(--text-lg)    │
  │  line-height: 1.8             │
  │  背景微微带心情色透明度:         │
  │    background: hsla(心情hue, 60%, 95%, 0.3)│
  └──────────────────────────────┘

底部操作栏:
  ┌──────────────────────────────┐
  │  [回信] pixel-btn-primary     │
  │  [私聊] pixel-btn-secondary   │
  │                               │
  │  第3轮时:                      │
  │  [确认约定] pixel-btn-primary  │
  │  [婉拒]   pixel-btn-danger    │
  └──────────────────────────────┘
```

### 2.4 滑动丢弃

```
信件卡片支持水平滑动:
  左滑 > 50% 宽度 → 归档（丢弃）
  滑动中: 信件倾斜 rotate(滑动比例 * -8deg) + 透明度递减
  松手后:
    超过阈值 → 继续飞出 + 回调 onArchive
    未超过   → 弹回原位（transition 200ms steps(2))
```

---

## 三、吉祥物引导系统

> 触发点：新用户注册完成 + 选完形象后首次进入主地图

### 3.1 吉祥物设计

```
名称: 小邮（You）— A2A 的信使猫
外形: 像素风格猫咪，戴着迷你邮差帽，背着小邮包
尺寸: 64×64px 精灵图
颜色: 主体 var(--px-gold-5) 金色
      帽子 var(--px-teal-6) 主题色
      邮包 var(--px-envelope) 信封色

站立动画: 上下微浮 @keyframes cat-bob (已有)
说话动画: 嘴巴切换两帧（张/合）+ 气泡弹出
```

### 3.2 引导流程 & 对话脚本

```
┌──────────────────────────────────────────────────────────────────┐
│  引导是一个分步 stepper，每步对应一段对话 + 一个高亮区域           │
│  用户可以点击「下一步」推进，或点击「跳过教程」直接关闭            │
│  跳过后，首次触碰未引导功能时，小邮会以小气泡做单次提示            │
└──────────────────────────────────────────────────────────────────┘

Step 1: 欢迎 + 小镇概览
  ┌───────────────────────────────────────────────┐
  │  🐱 小邮（出现在地图中央）:                      │
  │                                               │
  │  "欢迎来到 A2A 小镇！                           │
  │   我是小邮，你的信使向导。                       │
  │   这里每栋建筑都代表一种活动，                    │
  │   你可以派出你的小人去找志同道合的伙伴！"         │
  │                                               │
  │  高亮: 无（全地图展示）                          │
  │  操作: [下一步]  [跳过教程]                      │
  └───────────────────────────────────────────────┘
         ↓

Step 2: 派遣小人 + Zoom-in 演示
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    地图 zoom-in 到体育馆 (scale 1→1.6)          │
  │    镜头跟随小人走向体育馆 (translate 动画)        │
  │                                               │
  │  🐱 小邮（跟随在镜头旁边）:                      │
  │                                               │
  │  "看！点击一栋建筑，你的小人就会走过去。          │
  │   到达后你可以发布活动，寻找一起玩的伙伴！"       │
  │                                               │
  │  高亮: 体育馆建筑（其余区域半透明遮罩）           │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 3: 发布活动（半屏表单）
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    从底部弹出活动表单（半屏大小示意）              │
  │    表单内已预填 mock 数据                        │
  │                                               │
  │  🐱 小邮（缩小到表单右上角）:                     │
  │                                               │
  │  "填好活动内容后，长按这个按钮盖章寄出！           │
  │   不同人数的活动消耗不同的代币哦。"               │
  │                                               │
  │  高亮: 表单区域 + 盖章按钮                       │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 4: 邮箱
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    地图 zoom-out 回原比例                        │
  │    右下角邮箱图标高亮闪烁                        │
  │                                               │
  │  🐱 小邮（移动到邮箱旁边）:                      │
  │                                               │
  │  "这是你的邮箱！有人想加入你的活动时，             │
  │   邮箱会合上并亮起。                             │
  │   撕开信封就能看到对方的留言和心情～"              │
  │                                               │
  │  高亮: 右下角 Mailbox 图标                      │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 5: 信件与聊天
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    展示一封示例信件（已撕开状态）                  │
  │    左上角显示对方 Avatar                         │
  │                                               │
  │  🐱 小邮:                                      │
  │                                               │
  │  "点击对方的头像就能直接聊天。                    │
  │   放心，对方会由 AI 代为应答，                    │
  │   真人上线后会接管对话。                          │
  │   来回 3 封信后就要做决定啦！"                    │
  │                                               │
  │  高亮: Avatar 区域 + 回信/私聊按钮               │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 6: 好友
  ┌───────────────────────────────────────────────┐
  │  🐱 小邮（移到邮箱右侧）:                       │
  │                                               │
  │  "邮箱旁边是你的好友栏。                         │
  │   成功组队后就能加为好友，                        │
  │   以后可以直接邀请，不用再写信！"                  │
  │                                               │
  │  高亮: 好友入口图标                              │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 7: 广场猫咪
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    镜头平移到广场区域                             │
  │    一只橘猫在广场上散步                           │
  │                                               │
  │  🐱 小邮:                                      │
  │                                               │
  │  "如果不知道想做什么，来广场逛逛吧！               │
  │   不同颜色的小猫代表不同的活动，                   │
  │   点点看它们带来了什么消息～"                      │
  │                                               │
  │  高亮: 广场区域 + 猫咪                           │
  │  操作: [下一步]                                 │
  └───────────────────────────────────────────────┘
         ↓

Step 8: 许愿池
  ┌───────────────────────────────────────────────┐
  │  系统自动:                                      │
  │    镜头聚焦到广场许愿池                           │
  │                                               │
  │  🐱 小邮:                                      │
  │                                               │
  │  "这是许愿池！投入一个心愿，等别人来完成。          │
  │   或者捞一个别人的心愿，完成后就能认识 TA！        │
  │   缘分，就是这么来的 ✨"                         │
  │                                               │
  │  高亮: 许愿池建筑                                │
  │  操作: [开始探索！]                              │
  └───────────────────────────────────────────────┘
```

### 3.3 UI 布局规范

**对话气泡：**

```
┌────────────────────────────────────┐
│                                    │
│  ┌────────┐  ┌─────────────────┐  │
│  │ 🐱     │  │  对话文字...     │  │
│  │ 64×64  │  │                 │  │
│  │        │  │  font-body      │  │
│  └────────┘  │  text-lg (14px) │  │
│              │  line-height 1.8│  │
│              └────┬────────────┘  │
│                   │ 尾巴指向小邮   │
│                                    │
│  [下一步]            [跳过教程]    │
│  pixel-btn-primary   pixel-btn-secondary │
│                                    │
│  ● ● ● ○ ○ ○ ○ ○  (步骤指示器)   │
│                                    │
└────────────────────────────────────┘

对话气泡:
  background: var(--px-paper-0)
  border: var(--border-thick) solid var(--color-border)
  box-shadow: var(--pixel-shadow)
  padding: var(--space-4)
  max-width: 360px

  尾巴: CSS clip-path 或 ::before 伪元素
    width: 12px, height: 12px
    指向小邮图标方向

步骤指示器:
  ● 当前步: var(--px-teal-5), 8×8px
  ○ 未到步: var(--px-paper-3), 8×8px
  间距: var(--space-1)
```

**遮罩 & 高亮：**

```
引导遮罩:
  position: fixed; inset: 0;
  z-index: 9999;
  background: rgba(10, 12, 11, 0.6)

高亮区域:
  通过 CSS mask 或 clip-path 留出透明窗口
  透明窗口比高亮元素大 8px (每边 4px padding)
  窗口边框: 2px dashed var(--px-gold-5) — 金色虚线

高亮元素:
  position: relative; z-index: 10000;
  animation: guide-highlight-pulse 1.2s infinite;
```

**新增 @keyframes：**

```css
@keyframes guide-highlight-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(216, 176, 79, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(216, 176, 79, 0); }
}

@keyframes guide-mascot-enter {
  from { opacity: 0; transform: translateY(20px) scale(0.6); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes guide-bubble-pop {
  from { opacity: 0; transform: scale(0.85) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

### 3.4 Zoom-in 跟随视角

```
Step 2 的镜头动画:

地图容器 (.pixel-map-shell):
  默认: transform: scale(1); transform-origin: center;

zoom-in 效果:
  transition: transform 800ms steps(6, end);
  transform: scale(1.6) translate(目标建筑偏移);

  计算公式:
    targetX = (建筑col × tileSize) - (视口宽/2)
    targetY = (建筑row × tileSize) - (视口高/2)
    translateX = -targetX / 1.6
    translateY = -targetY / 1.6

zoom-out 恢复:
  transform: scale(1) translate(0, 0);
  transition: transform 600ms steps(4, end);
```

### 3.5 跳过 & 首次提示降级

```
如果用户跳过教程:
  localStorage.setItem('a2a-guide-done', '0')
  // '0' = 跳过, '1' = 完整完成

  首次点击场馆时:
    小邮出现一个小气泡 (3s 后消失):
    "点击建筑可以发布活动哦～"

  首次邮箱有信时:
    小邮出现在邮箱旁 (3s):
    "有新信件！撕开信封看看吧～"

  首次看到猫咪时:
    小邮出现在猫咪旁 (3s):
    "不同的猫咪代表不同的活动哦～"

  每个提示只出现一次:
    localStorage.setItem('a2a-hint-{hintId}', '1')
```

### 3.6 组件结构

```
src/components/Guide.tsx           — 主引导组件
src/components/Guide.css           — 引导样式
src/components/GuideBubble.tsx     — 小邮气泡（复用于降级提示）
src/data/guideSteps.ts             — 引导步骤配置数据

GuideProvider (Context):
  state: { currentStep, isActive, completedHints }
  actions: next(), skip(), showHint(hintId)
```

---

## 四、Zoom-in 跟随视角（派遣小人到场馆）

> 触发点：点击任意场馆建筑

### 4.1 动画时序

```
阶段1: 玩家小人开始移动 (0~600ms)
  ┌────────────────────────────────────┐
  │  小人面向目标建筑方向               │
  │  开始逐格行走动画                   │
  │  同时地图开始缩放:                  │
  │    scale: 1 → 1.4                 │
  │    镜头跟随小人平移                 │
  │    transition: steps(6, end)       │
  └────────────────────────────────────┘
         ↓

阶段2: 行走过程 (600ms~2000ms)
  ┌────────────────────────────────────┐
  │  小人沿路径逐格移动                 │
  │  镜头保持跟随（小人始终在视口中央）   │
  │  路径: 先水平再垂直（简单 L 型路径） │
  │  每步 200ms，步行动画交替帧          │
  └────────────────────────────────────┘
         ↓

阶段3: 到达 (2000ms~2400ms)
  ┌────────────────────────────────────┐
  │  小人到达建筑门前停下               │
  │  建筑高亮闪烁一次                   │
  │  弹出活动表单（从底部半屏 slide-up）  │
  │  地图保持 zoom-in 状态              │
  └────────────────────────────────────┘
         ↓

阶段4: 关闭表单后 (用户操作)
  ┌────────────────────────────────────┐
  │  表单收起                           │
  │  地图 zoom-out:                     │
  │    scale: 1.4 → 1                  │
  │    镜头回到中心                      │
  │    transition: steps(4, end)        │
  │  小人留在建筑旁或走回中心             │
  └────────────────────────────────────┘
```

### 4.2 CSS 实现

```css
.pixel-map-shell {
  transform-origin: center center;
  transition: transform 800ms steps(6, end);
}

.pixel-map-shell--zoomed {
  /* JS 动态设置 --zoom-x 和 --zoom-y */
  transform: scale(1.4) translate(var(--zoom-x), var(--zoom-y));
}
```

---

## 五、邮箱状态指示

### 5.1 双状态切换

```
无信件 — 邮箱开口:
  ┌─────┐
  │ ╔═╗ │  ← 盖子打开，向后翻
  │ ║  ║│
  │ ║  ║│  ← 邮箱主体
  │ ╚══╝│
  └─────┘
  颜色: var(--px-envelope) 暖色调
  无动画，静态

有信件 — 邮箱关闭:
  ┌─────┐
  │ ╔══╗│  ← 盖子合上
  │ ║  ║│
  │ ║📨║│  ← 可选: 信件边角探出
  │ ╚══╝│
  └─────┘
  颜色: 同上，但盖子颜色稍深 filter: brightness(0.92)
  右上角红色角标: 未读数字
  微微浮动动画: @keyframes pixel-bounce (已有)

状态切换动画:
  盖子翻转: rotateX(0) → rotateX(-120deg) 或反向
  时长: var(--dur-slow) = 400ms
  缓动: steps(3, end)
```

---

## 六、Composer 接入指南

当 Composer 实现以上交互时，按此顺序工作：

1. **先把新的 @keyframes 加到 `global.css`**（不改已有的动画）
2. **创建/修改组件 CSS** 引用这些 keyframes
3. **实现组件 TSX**，用状态机管理阶段切换
4. **接入 Context** 获取/修改数据
5. **测试各阶段过渡** 是否流畅

**关键原则：**
- 所有动画用 `steps()` 缓动，保持像素风
- 所有尺寸用 Token 变量，不硬编码
- 手势交互用 Pointer Events（不用 Touch Events），兼容鼠标和触屏
- 遮罩层 z-index 严格按照 `global.css` 中定义的层级
