/**
 * A2A Design System — Figma Plugin Script
 * 运行方式：Figma → Plugins → Development → Open Console → 粘贴运行
 * 或：Plugins → Development → New Plugin → Run script (paste code)
 *
 * 将在当前文件创建：
 *   • Color Styles（色彩样式）
 *   • Text Styles（文字样式）
 *   • 组件页面：Button, Input, Badge, Card, Avatar, Dialog, Tag
 *   • 设计规范页面
 */

// ─── 1. 调色板 ──────────────────────────────────────────────────────────────

const COLORS = {
  // Teal (Primary)
  "Teal/50":   { r: 0.933, g: 0.973, b: 0.965 },
  "Teal/100":  { r: 0.847, g: 0.937, b: 0.914 },
  "Teal/200":  { r: 0.718, g: 0.886, b: 0.851 },
  "Teal/300":  { r: 0.529, g: 0.816, b: 0.769 },
  "Teal/400":  { r: 0.318, g: 0.718, b: 0.663 },
  "Teal/500":  { r: 0.173, g: 0.588, b: 0.545 },  // --px-teal-6 主色
  "Teal/600":  { r: 0.122, g: 0.459, b: 0.431 },  // --px-teal-7
  "Teal/700":  { r: 0.098, g: 0.353, b: 0.333 },  // --px-teal-8
  "Teal/800":  { r: 0.075, g: 0.247, b: 0.239 },  // --px-teal-9
  "Teal/900":  { r: 0.043, g: 0.145, b: 0.145 },  // --px-teal-10

  // Paper (Warm White / Background)
  "Paper/0":   { r: 1.000, g: 0.996, b: 0.973 },  // --px-paper-0
  "Paper/50":  { r: 0.988, g: 0.988, b: 0.973 },  // --px-paper-1
  "Paper/100": { r: 0.953, g: 0.941, b: 0.910 },  // --px-paper-2
  "Paper/200": { r: 0.875, g: 0.851, b: 0.796 },  // --px-paper-3
  "Paper/300": { r: 0.784, g: 0.749, b: 0.682 },  // --px-paper-4

  // Ink (Text)
  "Ink/300":   { r: 0.471, g: 0.435, b: 0.396 },  // --px-ink-1
  "Ink/500":   { r: 0.294, g: 0.267, b: 0.239 },  // --px-ink-2
  "Ink/700":   { r: 0.169, g: 0.153, b: 0.137 },  // --px-ink-3
  "Ink/900":   { r: 0.090, g: 0.082, b: 0.075 },  // --px-ink-4

  // Accent — Gold
  "Gold/400":  { r: 0.847, g: 0.690, b: 0.310 },  // --px-gold-5
  "Gold/600":  { r: 0.651, g: 0.502, b: 0.176 },  // --px-gold-7

  // Accent — Rose
  "Rose/400":  { r: 0.839, g: 0.400, b: 0.514 },  // --px-rose-5
  "Rose/600":  { r: 0.671, g: 0.306, b: 0.404 },  // --px-rose-7

  // Accent — Sky
  "Sky/400":   { r: 0.361, g: 0.604, b: 0.839 },  // --px-sky-5
  "Sky/600":   { r: 0.259, g: 0.455, b: 0.639 },  // --px-sky-7

  // Accent — Lime
  "Lime/400":  { r: 0.529, g: 0.737, b: 0.325 },  // --px-lime-5
  "Lime/600":  { r: 0.365, g: 0.557, b: 0.208 },  // --px-lime-7

  // Accent — Purple
  "Purple/400":{ r: 0.592, g: 0.467, b: 0.788 },  // --px-purple-5
  "Purple/600":{ r: 0.424, g: 0.314, b: 0.639 },  // --px-purple-7

  // Special
  "Special/Envelope":     { r: 0.910, g: 0.835, b: 0.659 },
  "Special/EnvelopeBorder":{ r: 0.545, g: 0.412, b: 0.078 },
  "Special/DarkBoot":     { r: 0.039, g: 0.039, b: 0.047 },

  // Semantic (aliases)
  "Semantic/Background":  { r: 0.953, g: 0.941, b: 0.910 },
  "Semantic/Surface":     { r: 0.988, g: 0.988, b: 0.973 },
  "Semantic/Border":      { r: 0.169, g: 0.153, b: 0.137 },
  "Semantic/BorderSoft":  { r: 0.784, g: 0.749, b: 0.682 },
  "Semantic/TextDefault": { r: 0.169, g: 0.153, b: 0.137 },
  "Semantic/TextMuted":   { r: 0.471, g: 0.435, b: 0.396 },
  "Semantic/TextInverse": { r: 1.000, g: 0.996, b: 0.973 },
  "Semantic/Primary":     { r: 0.173, g: 0.588, b: 0.545 },
  "Semantic/PrimaryHover":{ r: 0.318, g: 0.718, b: 0.663 },
  "Semantic/Danger":      { r: 0.839, g: 0.400, b: 0.514 },
  "Semantic/Success":     { r: 0.529, g: 0.737, b: 0.325 },
  "Semantic/Notice":      { r: 0.361, g: 0.604, b: 0.839 },
  "Semantic/Warm":        { r: 0.847, g: 0.690, b: 0.310 },
  "Semantic/Accent":      { r: 0.592, g: 0.467, b: 0.788 },

  // Map Colors
  "Map/Grass1":  { r: 0.725, g: 0.863, b: 0.525 },
  "Map/Grass2":  { r: 0.553, g: 0.769, b: 0.357 },
  "Map/Path1":   { r: 0.847, g: 0.780, b: 0.553 },
  "Map/Water1":  { r: 0.529, g: 0.741, b: 0.851 },
  "Map/Roof1":   { r: 0.847, g: 0.435, b: 0.286 },
  "Map/Wall1":   { r: 0.961, g: 0.914, b: 0.812 },
};

// ─── 2. 文字样式 ─────────────────────────────────────────────────────────────

const TEXT_STYLES = [
  // Pixel Font (像素风格标题)
  { name: "Pixel/Display",   font: "Press Start 2P", size: 20, weight: 400, lineH: 32 },
  { name: "Pixel/Heading1",  font: "Press Start 2P", size: 16, weight: 400, lineH: 28 },
  { name: "Pixel/Heading2",  font: "Press Start 2P", size: 14, weight: 400, lineH: 24 },
  { name: "Pixel/Heading3",  font: "Press Start 2P", size: 12, weight: 400, lineH: 20 },
  { name: "Pixel/Body",      font: "Press Start 2P", size: 10, weight: 400, lineH: 18 },
  { name: "Pixel/Small",     font: "Press Start 2P", size:  8, weight: 400, lineH: 14 },
  { name: "Pixel/XSmall",    font: "Press Start 2P", size:  7, weight: 400, lineH: 12 },

  // Body Font (正文)
  { name: "Body/XL-Bold",    font: "Noto Sans SC",   size: 16, weight: 700, lineH: 26 },
  { name: "Body/XL-Regular", font: "Noto Sans SC",   size: 16, weight: 400, lineH: 26 },
  { name: "Body/LG-Bold",    font: "Noto Sans SC",   size: 14, weight: 700, lineH: 22 },
  { name: "Body/LG-Regular", font: "Noto Sans SC",   size: 14, weight: 400, lineH: 22 },
  { name: "Body/MD-Bold",    font: "Noto Sans SC",   size: 12, weight: 700, lineH: 20 },
  { name: "Body/MD-Regular", font: "Noto Sans SC",   size: 12, weight: 400, lineH: 20 },
  { name: "Body/Base-Bold",  font: "Noto Sans SC",   size: 10, weight: 700, lineH: 16 },
  { name: "Body/Base",       font: "Noto Sans SC",   size: 10, weight: 400, lineH: 16 },
  { name: "Body/SM",         font: "Noto Sans SC",   size:  8, weight: 400, lineH: 14 },
  { name: "Body/XS",         font: "Noto Sans SC",   size:  7, weight: 400, lineH: 12 },
];

// ─── 3. 间距系统 ─────────────────────────────────────────────────────────────

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40]; // space-1 ~ space-8

// ─── 4. 主函数 ───────────────────────────────────────────────────────────────

async function buildDesignSystem() {
  const doc = figma.currentPage.parent;

  // 找到或创建 Design System 页面
  let dsPage = doc.children.find(p => p.name === "🎨 Design System");
  if (!dsPage) {
    dsPage = figma.createPage();
    dsPage.name = "🎨 Design System";
  }
  figma.currentPage = dsPage;

  // ── 4.1 创建颜色样式 ───────────────────────────────────────────────────────
  console.log("Creating color styles...");
  for (const [name, rgb] of Object.entries(COLORS)) {
    const style = figma.createPaintStyle();
    style.name = name;
    style.paints = [{
      type: "SOLID",
      color: rgb,
      opacity: 1
    }];
  }

  // ── 4.2 创建文字样式 ───────────────────────────────────────────────────────
  console.log("Creating text styles...");
  for (const ts of TEXT_STYLES) {
    const style = figma.createTextStyle();
    style.name = ts.name;
    try {
      await figma.loadFontAsync({ family: ts.font, style: ts.weight === 700 ? "Bold" : "Regular" });
      style.fontName = { family: ts.font, style: ts.weight === 700 ? "Bold" : "Regular" };
      style.fontSize = ts.size;
      style.lineHeight = { unit: "PIXELS", value: ts.lineH };
      style.letterSpacing = { unit: "PERCENT", value: 0 };
    } catch (e) {
      console.warn(`Font ${ts.font} not available, using fallback`);
    }
  }

  // ── 4.3 创建视觉画布 ──────────────────────────────────────────────────────
  let y = 0;

  // 标题
  y = createSectionTitle(dsPage, "A2A · Pixelium Design System", 0, y, 1200);
  y += 60;

  // 色彩展示
  y = createSectionTitle(dsPage, "Colors", 0, y, 200);
  y += 10;
  y = createColorPalette(dsPage, y);
  y += 60;

  // 文字展示
  y = createSectionTitle(dsPage, "Typography", 0, y, 200);
  y += 10;
  y = await createTypographySamples(dsPage, y);
  y += 60;

  // 间距展示
  y = createSectionTitle(dsPage, "Spacing", 0, y, 200);
  y += 10;
  y = createSpacingBlocks(dsPage, y);
  y += 60;

  // 组件：按钮
  y = createSectionTitle(dsPage, "Components — Buttons", 0, y, 300);
  y += 10;
  y = await createButtons(dsPage, y);
  y += 60;

  // 组件：输入框
  y = createSectionTitle(dsPage, "Components — Inputs", 0, y, 300);
  y += 10;
  y = await createInputs(dsPage, y);
  y += 60;

  // 组件：徽章/状态标签
  y = createSectionTitle(dsPage, "Components — Badges & Tags", 0, y, 300);
  y += 10;
  y = await createBadges(dsPage, y);
  y += 60;

  // 组件：卡片
  y = createSectionTitle(dsPage, "Components — Cards", 0, y, 300);
  y += 10;
  y = await createCards(dsPage, y);

  // 放大到视图
  figma.viewport.scrollAndZoomIntoView(dsPage.children);

  figma.notify("✅ A2A Design System 已创建完成！", { timeout: 5000 });
}

// ─── 辅助：章节标题 ──────────────────────────────────────────────────────────

function createSectionTitle(page, text, x, y, width) {
  const frame = figma.createFrame();
  frame.name = `Section/${text}`;
  frame.x = x; frame.y = y;
  frame.resize(width, 36);
  frame.fills = [{ type: "SOLID", color: { r: 0.173, g: 0.588, b: 0.545 } }];
  frame.cornerRadius = 0;

  const label = figma.createText();
  label.characters = text.toUpperCase();
  label.fontSize = 11;
  label.fontName = { family: "Noto Sans SC", style: "Bold" };
  label.fills = [{ type: "SOLID", color: { r: 1, g: 0.996, b: 0.973 } }];
  label.x = 12; label.y = 10;

  frame.appendChild(label);
  page.appendChild(frame);
  return y + 36;
}

// ─── 辅助：颜色板 ────────────────────────────────────────────────────────────

function createColorPalette(page, startY) {
  const groups = {
    "Teal": ["Teal/50","Teal/100","Teal/200","Teal/300","Teal/400","Teal/500","Teal/600","Teal/700","Teal/800","Teal/900"],
    "Paper": ["Paper/0","Paper/50","Paper/100","Paper/200","Paper/300"],
    "Ink":   ["Ink/300","Ink/500","Ink/700","Ink/900"],
    "Gold":  ["Gold/400","Gold/600"],
    "Rose":  ["Rose/400","Rose/600"],
    "Sky":   ["Sky/400","Sky/600"],
    "Lime":  ["Lime/400","Lime/600"],
    "Purple":["Purple/400","Purple/600"],
  };

  let y = startY;
  for (const [groupName, keys] of Object.entries(groups)) {
    let x = 0;

    // Group label
    const lbl = figma.createText();
    lbl.characters = groupName;
    lbl.fontSize = 9;
    lbl.fontName = { family: "Noto Sans SC", style: "Regular" };
    lbl.fills = [{ type: "SOLID", color: COLORS["Ink/500"] }];
    lbl.x = 0; lbl.y = y - 18;
    page.appendChild(lbl);

    for (const key of keys) {
      const swatch = figma.createFrame();
      swatch.name = key;
      swatch.x = x; swatch.y = y;
      swatch.resize(56, 56);
      swatch.fills = [{ type: "SOLID", color: COLORS[key] }];
      swatch.strokeWeight = 2;
      swatch.strokes = [{ type: "SOLID", color: COLORS["Ink/700"], opacity: 0.3 }];
      swatch.cornerRadius = 0;

      const label = figma.createText();
      const shortName = key.split("/")[1];
      label.characters = shortName;
      label.fontSize = 7;
      label.fontName = { family: "Noto Sans SC", style: "Regular" };
      const isDark = COLORS[key].r < 0.5 || (key.startsWith("Ink") && true);
      label.fills = [{ type: "SOLID", color: isDark ? { r:1,g:1,b:1 } : { r:0.1,g:0.1,b:0.1 } }];
      label.x = 4; label.y = 38;
      swatch.appendChild(label);
      page.appendChild(swatch);
      x += 64;
    }
    y += 80;
  }
  return y;
}

// ─── 辅助：文字样式展示 ───────────────────────────────────────────────────────

async function createTypographySamples(page, startY) {
  let y = startY;
  for (const ts of TEXT_STYLES) {
    try {
      await figma.loadFontAsync({ family: ts.font, style: ts.weight === 700 ? "Bold" : "Regular" });
    } catch(e) {}

    const t = figma.createText();
    t.characters = `${ts.name}  — A2A 像素小镇  Aa Bb 123`;
    try {
      t.fontName = { family: ts.font, style: ts.weight === 700 ? "Bold" : "Regular" };
    } catch(e) {
      t.fontName = { family: "Noto Sans SC", style: "Regular" };
    }
    t.fontSize = ts.size;
    t.fills = [{ type: "SOLID", color: COLORS["Ink/700"] }];
    t.x = 0; t.y = y;
    page.appendChild(t);

    const meta = figma.createText();
    meta.characters = `${ts.font} / ${ts.size}px / ${ts.weight === 700 ? "Bold" : "Regular"} / lh ${ts.lineH}px`;
    meta.fontName = { family: "Noto Sans SC", style: "Regular" };
    meta.fontSize = 9;
    meta.fills = [{ type: "SOLID", color: COLORS["Ink/300"] }];
    meta.x = 600; meta.y = y + (ts.size - 9) / 2;
    page.appendChild(meta);

    y += ts.lineH + 8;
  }
  return y;
}

// ─── 辅助：间距块 ────────────────────────────────────────────────────────────

function createSpacingBlocks(page, startY) {
  let x = 0;
  SPACING.forEach((size, i) => {
    const block = figma.createFrame();
    block.name = `space-${i+1}`;
    block.x = x; block.y = startY;
    block.resize(size, size);
    block.fills = [{ type: "SOLID", color: COLORS["Teal/400"] }];
    block.strokeWeight = 2;
    block.strokes = [{ type: "SOLID", color: COLORS["Teal/600"] }];
    page.appendChild(block);

    const lbl = figma.createText();
    lbl.characters = `${size}px\nspace-${i+1}`;
    lbl.fontName = { family: "Noto Sans SC", style: "Regular" };
    lbl.fontSize = 8;
    lbl.fills = [{ type: "SOLID", color: COLORS["Ink/500"] }];
    lbl.x = x; lbl.y = startY + 48;
    page.appendChild(lbl);

    x += size + 24;
  });
  return startY + 80;
}

// ─── 辅助：按钮组件 ──────────────────────────────────────────────────────────

async function createButtons(page, startY) {
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Regular" });
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Bold" });

  const variants = [
    { label: "Primary",   bg: COLORS["Teal/500"],   fg: COLORS["Paper/0"],   border: COLORS["Teal/700"]  },
    { label: "Secondary", bg: COLORS["Paper/100"],  fg: COLORS["Ink/700"],   border: COLORS["Ink/700"]   },
    { label: "Danger",    bg: COLORS["Rose/400"],   fg: COLORS["Paper/0"],   border: COLORS["Rose/600"]  },
    { label: "Ghost",     bg: { r:0,g:0,b:0 },      fg: COLORS["Teal/500"],  border: COLORS["Teal/500"], transparent: true },
  ];

  const sizes = [
    { label: "SM",  px: 12, py: 6,  fontSize: 9,  radius: 0 },
    { label: "MD",  px: 16, py: 10, fontSize: 10, radius: 0 },
    { label: "LG",  px: 24, py: 14, fontSize: 12, radius: 0 },
  ];

  let x = 0;
  let maxH = 0;

  for (const v of variants) {
    let y = startY;
    for (const s of sizes) {
      const btn = figma.createFrame();
      btn.name = `Button/${v.label}/${s.label}`;
      btn.x = x; btn.y = y;
      btn.layoutMode = "HORIZONTAL";
      btn.primaryAxisAlignItems = "CENTER";
      btn.counterAxisAlignItems = "CENTER";
      btn.paddingLeft = s.px; btn.paddingRight = s.px;
      btn.paddingTop = s.py; btn.paddingBottom = s.py;
      btn.fills = v.transparent ? [] : [{ type: "SOLID", color: v.bg }];
      btn.strokeWeight = 3;
      btn.strokes = [{ type: "SOLID", color: v.border }];
      btn.cornerRadius = 0;

      const t = figma.createText();
      t.characters = `${v.label} Button`;
      t.fontName = { family: "Noto Sans SC", style: "Bold" };
      t.fontSize = s.fontSize;
      t.fills = [{ type: "SOLID", color: v.fg }];
      btn.appendChild(t);
      btn.resize(btn.width || 120, btn.height || 36);

      page.appendChild(btn);
      y += (s.py * 2 + s.fontSize + 20) + 12;
    }
    x += 160;
  }

  return startY + 150;
}

// ─── 辅助：输入框 ────────────────────────────────────────────────────────────

async function createInputs(page, startY) {
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Regular" });

  const states = [
    { label: "Default",  border: COLORS["Ink/700"], bg: COLORS["Paper/0"] },
    { label: "Focus",    border: COLORS["Teal/500"], bg: COLORS["Paper/0"] },
    { label: "Error",    border: COLORS["Rose/400"], bg: COLORS["Paper/0"] },
    { label: "Disabled", border: COLORS["Paper/300"], bg: COLORS["Paper/100"] },
  ];

  let x = 0;
  for (const s of states) {
    const field = figma.createFrame();
    field.name = `Input/${s.label}`;
    field.x = x; field.y = startY;
    field.resize(200, 36);
    field.fills = [{ type: "SOLID", color: s.bg }];
    field.strokeWeight = 3;
    field.strokes = [{ type: "SOLID", color: s.border }];
    field.cornerRadius = 0;

    const placeholder = figma.createText();
    placeholder.characters = s.label === "Disabled" ? "Disabled" : "输入内容...";
    placeholder.fontName = { family: "Noto Sans SC", style: "Regular" };
    placeholder.fontSize = 10;
    placeholder.fills = [{ type: "SOLID", color: s.label === "Disabled" ? COLORS["Paper/300"] : COLORS["Ink/300"], opacity: 1 }];
    placeholder.x = 10; placeholder.y = 10;
    field.appendChild(placeholder);

    const lbl = figma.createText();
    lbl.characters = s.label;
    lbl.fontName = { family: "Noto Sans SC", style: "Regular" };
    lbl.fontSize = 9;
    lbl.fills = [{ type: "SOLID", color: COLORS["Ink/300"] }];
    lbl.x = x; lbl.y = startY + 44;
    page.appendChild(lbl);

    page.appendChild(field);
    x += 220;
  }
  return startY + 80;
}

// ─── 辅助：徽章 ──────────────────────────────────────────────────────────────

async function createBadges(page, startY) {
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Bold" });

  const badges = [
    { label: "匹配成功",  bg: COLORS["Teal/500"],   fg: COLORS["Paper/0"]   },
    { label: "等待中",    bg: COLORS["Gold/400"],   fg: COLORS["Ink/900"]   },
    { label: "已拒绝",   bg: COLORS["Rose/400"],   fg: COLORS["Paper/0"]   },
    { label: "新消息",   bg: COLORS["Sky/400"],    fg: COLORS["Paper/0"]   },
    { label: "线下见面", bg: COLORS["Lime/400"],   fg: COLORS["Ink/900"]   },
    { label: "Avatar",   bg: COLORS["Purple/400"], fg: COLORS["Paper/0"]   },
  ];

  let x = 0;
  for (const b of badges) {
    const badge = figma.createFrame();
    badge.name = `Badge/${b.label}`;
    badge.x = x; badge.y = startY;
    badge.layoutMode = "HORIZONTAL";
    badge.primaryAxisAlignItems = "CENTER";
    badge.counterAxisAlignItems = "CENTER";
    badge.paddingLeft = 8; badge.paddingRight = 8;
    badge.paddingTop = 3; badge.paddingBottom = 3;
    badge.fills = [{ type: "SOLID", color: b.bg }];
    badge.strokeWeight = 2;
    badge.strokes = [{ type: "SOLID", color: b.fg, opacity: 0.4 }];
    badge.cornerRadius = 0;

    const t = figma.createText();
    t.characters = b.label;
    t.fontName = { family: "Noto Sans SC", style: "Bold" };
    t.fontSize = 9;
    t.fills = [{ type: "SOLID", color: b.fg }];
    badge.appendChild(t);
    page.appendChild(badge);
    x += badge.width + 12;
  }
  return startY + 60;
}

// ─── 辅助：卡片 ──────────────────────────────────────────────────────────────

async function createCards(page, startY) {
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Regular" });
  await figma.loadFontAsync({ family: "Noto Sans SC", style: "Bold" });

  // Agent 卡片
  const card = figma.createFrame();
  card.name = "Card/AgentProfile";
  card.x = 0; card.y = startY;
  card.resize(240, 160);
  card.fills = [{ type: "SOLID", color: COLORS["Paper/50"] }];
  card.strokeWeight = 4;
  card.strokes = [{ type: "SOLID", color: COLORS["Ink/700"] }];
  card.cornerRadius = 0;
  card.effects = [{
    type: "DROP_SHADOW",
    color: { r: 0.067, g: 0.082, b: 0.075, a: 0.26 },
    offset: { x: 8, y: 8 },
    radius: 0,
    visible: true,
    blendMode: "NORMAL"
  }];

  // Avatar placeholder
  const avatar = figma.createEllipse();
  avatar.x = 16; avatar.y = 16;
  avatar.resize(48, 48);
  avatar.fills = [{ type: "SOLID", color: COLORS["Teal/400"] }];
  avatar.strokes = [{ type: "SOLID", color: COLORS["Ink/700"] }];
  avatar.strokeWeight = 3;

  const name = figma.createText();
  name.characters = "Mira · INFJ";
  name.fontName = { family: "Noto Sans SC", style: "Bold" };
  name.fontSize = 12;
  name.fills = [{ type: "SOLID", color: COLORS["Ink/700"] }];
  name.x = 76; name.y = 24;

  const subtitle = figma.createText();
  subtitle.characters = "AI 分身 · 在线";
  subtitle.fontName = { family: "Noto Sans SC", style: "Regular" };
  subtitle.fontSize = 9;
  subtitle.fills = [{ type: "SOLID", color: COLORS["Teal/500"] }];
  subtitle.x = 76; subtitle.y = 42;

  const divider = figma.createLine();
  divider.x = 16; divider.y = 80;
  divider.resize(208, 0);
  divider.strokes = [{ type: "SOLID", color: COLORS["Paper/300"] }];
  divider.strokeWeight = 2;

  const bio = figma.createText();
  bio.characters = "「今晚想找人一起去图书馆看书，有人吗？」";
  bio.fontName = { family: "Noto Sans SC", style: "Regular" };
  bio.fontSize = 9;
  bio.fills = [{ type: "SOLID", color: COLORS["Ink/500"] }];
  bio.x = 16; bio.y = 92;
  bio.resize(208, 40);
  bio.textAutoResize = "HEIGHT";

  card.appendChild(avatar);
  card.appendChild(name);
  card.appendChild(subtitle);
  card.appendChild(divider);
  card.appendChild(bio);
  page.appendChild(card);

  // 匹配报告卡片
  const matchCard = figma.createFrame();
  matchCard.name = "Card/MatchReport";
  matchCard.x = 264; matchCard.y = startY;
  matchCard.resize(280, 160);
  matchCard.fills = [{ type: "SOLID", color: COLORS["Paper/50"] }];
  matchCard.strokeWeight = 4;
  matchCard.strokes = [{ type: "SOLID", color: COLORS["Teal/600"] }];
  matchCard.cornerRadius = 0;
  matchCard.effects = [{
    type: "DROP_SHADOW",
    color: { r: 0.067, g: 0.082, b: 0.075, a: 0.26 },
    offset: { x: 8, y: 8 },
    radius: 0,
    visible: true,
    blendMode: "NORMAL"
  }];

  const matchTitle = figma.createText();
  matchTitle.characters = "匹配报告 · Match Report";
  matchTitle.fontName = { family: "Noto Sans SC", style: "Bold" };
  matchTitle.fontSize = 11;
  matchTitle.fills = [{ type: "SOLID", color: COLORS["Teal/600"] }];
  matchTitle.x = 16; matchTitle.y = 14;

  const scoreLabel = figma.createText();
  scoreLabel.characters = "认同度 ToC";
  scoreLabel.fontName = { family: "Noto Sans SC", style: "Regular" };
  scoreLabel.fontSize = 9;
  scoreLabel.fills = [{ type: "SOLID", color: COLORS["Ink/300"] }];
  scoreLabel.x = 16; scoreLabel.y = 40;

  const score = figma.createText();
  score.characters = "92%";
  score.fontName = { family: "Noto Sans SC", style: "Bold" };
  score.fontSize = 28;
  score.fills = [{ type: "SOLID", color: COLORS["Teal/500"] }];
  score.x = 16; score.y = 54;

  const desc = figma.createText();
  desc.characters = "Mira 和 Kai 在「饭搭子」意图上\n高度契合，推荐明晚 7pm 约见。";
  desc.fontName = { family: "Noto Sans SC", style: "Regular" };
  desc.fontSize = 9;
  desc.fills = [{ type: "SOLID", color: COLORS["Ink/500"] }];
  desc.x = 100; desc.y = 40;
  desc.resize(164, 80);
  desc.textAutoResize = "HEIGHT";

  matchCard.appendChild(matchTitle);
  matchCard.appendChild(scoreLabel);
  matchCard.appendChild(score);
  matchCard.appendChild(desc);
  page.appendChild(matchCard);

  return startY + 200;
}

// ─── 5. 执行 ─────────────────────────────────────────────────────────────────

buildDesignSystem().then(() => {
  console.log("A2A Design System 创建完成！");
}).catch(err => {
  console.error("Error:", err);
  figma.notify("❌ 创建失败: " + err.message, { error: true });
});
