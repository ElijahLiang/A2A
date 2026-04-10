/**
 * generate_figma_svg.js
 * 生成可导入 Figma 的 SVG 文件，包含地图背景 + 各建筑图层
 * 运行: node tools/generate_figma_svg.js
 * 输出: deliverables/town-map.svg
 */

const fs = require('fs')
const path = require('path')

// ── 画布尺寸（与 PixelMap 逻辑坐标一致）──────────────────────
const MAP_W = 1376
const MAP_H = 768

// ── 建筑配置（与 buildings.ts 保持同步）─────────────────────
const BUILDINGS = [
  { id: 'library',     name: '图书馆', file: 'library.png',    x: 195,  y: 258, scale: 0.26 },
  { id: 'cafe',        name: '咖啡店', file: 'coffee-shop.png', x: 448,  y: 388, scale: 0.25 },
  { id: 'restaurant',  name: '餐厅',   file: 'restaurant.png', x: 858,  y: 252, scale: 0.25 },
  { id: 'town_square', name: '广场',   file: 'square.png',     x: 628,  y: 485, scale: 0.135 },
  { id: 'post_office', name: '许愿池', file: 'pond.png',       x: 155,  y: 685, scale: 0.13 },
  { id: 'arcade',      name: '书店',   file: 'bookstore.png',  x: 1190, y: 462, scale: 0.26 },
  { id: 'gym',         name: '健身房', file: 'gym.png',        x: 1200, y: 745, scale: 0.26 },
  { id: 'home',        name: '公园',   file: 'park.png',       x: 435,  y: 742, scale: 0.23 },
  { id: 'cinema',      name: '画廊',   file: 'gallery.png',    x: 948,  y: 520, scale: 0.25 },
]

// ── 原始图片尺寸（像素）────────────────────────────────────────
const SIZES = {
  'library.png':    { w: 598,  h: 635  },
  'coffee-shop.png':{ w: 533,  h: 580  },
  'restaurant.png': { w: 597,  h: 643  },
  'square.png':     { w: 2048, h: 1634 },
  'pond.png':       { w: 1303, h: 1055 },
  'bookstore.png':  { w: 460,  h: 497  },
  'gym.png':        { w: 531,  h: 518  },
  'park.png':       { w: 562,  h: 568  },
  'gallery.png':    { w: 485,  h: 508  },
}

// ── 路径 ─────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(ROOT, 'apps', 'web', 'public', 'building-assets')
const BG_PATH    = path.join(ROOT, 'apps', 'web', 'public', 'map-bg.png')
const OUT_DIR    = path.join(ROOT, 'deliverables')
const OUT_FILE   = path.join(OUT_DIR, 'town-map.svg')

// ── 辅助：读文件 → base64 data URI ──────────────────────────
function toDataURI(filePath, mime) {
  const buf = fs.readFileSync(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}

// ── 构建 SVG ─────────────────────────────────────────────────
function buildSVG() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const lines = []

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg"`)
  lines.push(`     xmlns:xlink="http://www.w3.org/1999/xlink"`)
  lines.push(`     width="${MAP_W}" height="${MAP_H}"`)
  lines.push(`     viewBox="0 0 ${MAP_W} ${MAP_H}">`)

  // ── 背景图层 ──────────────────────────────────────────────
  lines.push(``)
  lines.push(`  <!-- ╔══════════════════════════════╗ -->`)
  lines.push(`  <!-- ║  Background — 地图地形背景  ║ -->`)
  lines.push(`  <!-- ╚══════════════════════════════╝ -->`)
  const bgURI = toDataURI(BG_PATH, 'image/png')
  lines.push(`  <image id="background" x="0" y="0"`)
  lines.push(`         width="${MAP_W}" height="${MAP_H}"`)
  lines.push(`         preserveAspectRatio="xMidYMid slice"`)
  lines.push(`         href="${bgURI}" />`)

  // ── 建筑图层 ──────────────────────────────────────────────
  lines.push(``)
  lines.push(`  <!-- ╔══════════════════════════════╗ -->`)
  lines.push(`  <!-- ║     Buildings — 建筑图层    ║ -->`)
  lines.push(`  <!-- ╚══════════════════════════════╝ -->`)

  // 按 y 排序（isometric z-order：y 越大越靠前）
  const sorted = [...BUILDINGS].sort((a, b) => a.y - b.y)

  for (const b of sorted) {
    const size = SIZES[b.file]
    const pw = Math.round(size.w * b.scale)   // 渲染宽度
    const ph = Math.round(size.h * b.scale)   // 渲染高度
    // transform: translate(-50%, -100%) → 左上角偏移
    const rx = b.x - pw / 2
    const ry = b.y - ph

    const imgPath = path.join(ASSETS_DIR, b.file)
    if (!fs.existsSync(imgPath)) {
      console.warn(`⚠️  找不到: ${imgPath}`)
      continue
    }
    const imgURI = toDataURI(imgPath, 'image/png')

    lines.push(``)
    lines.push(`  <!-- ${b.name} (${b.id}) x=${b.x} y=${b.y} scale=${b.scale} -->`)
    lines.push(`  <g id="${b.id}" data-name="${b.name}">`)
    lines.push(`    <image x="${rx}" y="${ry}"`)
    lines.push(`           width="${pw}" height="${ph}"`)
    lines.push(`           href="${imgURI}" />`)
    lines.push(`  </g>`)
  }

  // ── 工具栏占位（底部导航参考线）─────────────────────────
  lines.push(``)
  lines.push(`  <!-- 底部导航栏参考线 (toolbar 70px) -->`)
  lines.push(`  <rect id="toolbar-guide" x="0" y="${MAP_H - 70}"`)
  lines.push(`        width="${MAP_W}" height="70"`)
  lines.push(`        fill="rgba(252,252,248,0.85)" stroke="#2b2728" stroke-width="2" />`)
  lines.push(`  <text x="${MAP_W / 2}" y="${MAP_H - 30}"`)
  lines.push(`        text-anchor="middle" font-size="12" fill="#4b5470"`)
  lines.push(`        font-family="monospace">`)
  lines.push(`    底部导航栏 · 70px · 小镇 / 信箱 / 广场 / 好友 / 我的`)
  lines.push(`  </text>`)

  lines.push(``)
  lines.push(`</svg>`)

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf-8')
  return OUT_FILE
}

// ── 执行 ─────────────────────────────────────────────────────
console.log('正在生成 SVG，内嵌图片中...')
const out = buildSVG()
const size = (fs.statSync(out).size / 1024 / 1024).toFixed(1)
console.log(`✅  生成完成：${out}`)
console.log(`    文件大小：${size} MB`)
console.log(``)
console.log(`导入 Figma 方式：`)
console.log(`  1. 打开 Figma → File → Import (或直接拖入)`)
console.log(`  2. 选择 deliverables/town-map.svg`)
console.log(`  3. 每个建筑是独立图层（按 id 命名），可自由拖动`)
console.log(`  4. 调整完后将坐标反馈，我同步更新到 buildings.ts`)
