#!/usr/bin/env node
/**
 * figma-push-tokens.mjs
 * Pushes A2A design system tokens to Figma Variables.
 *
 * Requirements:
 *   - Figma Professional (or above) plan
 *   - Personal Access Token with scopes:
 *       file_variables:read  +  file_variables:write
 *
 * Usage:
 *   FIGMA_TOKEN=<token> node scripts/figma-push-tokens.mjs
 *   — or —
 *   node scripts/figma-push-tokens.mjs  (uses TOKEN constant below)
 */

const FILE_KEY    = 'HMBvElWNKCrpFNoPx7AQF6';
const FIGMA_TOKEN = process.env.FIGMA_TOKEN ?? 'PASTE_NEW_TOKEN_HERE';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a 6-digit hex string to Figma RGBA (0-1 range). */
function rgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

// ── Token definitions ─────────────────────────────────────────────────────────
// Each collection → one Figma Variables Collection
// Each var        → one Figma Variable + one mode value

const COLLECTIONS = [
  // ── 1. Color Primitives ───────────────────────────────────────────────────
  {
    id:       'col_primitives',
    name:     '🎨 Primitives',
    modeId:   'mode_primitives',
    modeName: 'Default',
    vars: [
      // Teal
      { name: 'teal/100',  type: 'COLOR', value: rgb('#eef8f6') },
      { name: 'teal/200',  type: 'COLOR', value: rgb('#d8efe9') },
      { name: 'teal/300',  type: 'COLOR', value: rgb('#b7e2d9') },
      { name: 'teal/400',  type: 'COLOR', value: rgb('#87d0c4') },
      { name: 'teal/500',  type: 'COLOR', value: rgb('#51b7a9') },
      { name: 'teal/600',  type: 'COLOR', value: rgb('#2c968b') },
      { name: 'teal/700',  type: 'COLOR', value: rgb('#1f756e') },
      { name: 'teal/800',  type: 'COLOR', value: rgb('#195a55') },
      { name: 'teal/900',  type: 'COLOR', value: rgb('#133f3d') },
      { name: 'teal/1000', type: 'COLOR', value: rgb('#0b2525') },
      // Paper (warm white neutrals)
      { name: 'paper/0',   type: 'COLOR', value: rgb('#fffef8') },
      { name: 'paper/100', type: 'COLOR', value: rgb('#fcfcf8') },
      { name: 'paper/200', type: 'COLOR', value: rgb('#f3f0e8') },
      { name: 'paper/300', type: 'COLOR', value: rgb('#dfd9cb') },
      { name: 'paper/400', type: 'COLOR', value: rgb('#c8bfae') },
      // Ink (dark neutrals)
      { name: 'ink/100',   type: 'COLOR', value: rgb('#786f65') },
      { name: 'ink/200',   type: 'COLOR', value: rgb('#4b443d') },
      { name: 'ink/300',   type: 'COLOR', value: rgb('#2b2723') },
      { name: 'ink/400',   type: 'COLOR', value: rgb('#171513') },
      // Gold accent
      { name: 'gold/500',  type: 'COLOR', value: rgb('#d8b04f') },
      { name: 'gold/700',  type: 'COLOR', value: rgb('#a6802d') },
      // Rose accent
      { name: 'rose/500',  type: 'COLOR', value: rgb('#d66683') },
      { name: 'rose/700',  type: 'COLOR', value: rgb('#ab4e67') },
      // Sky accent
      { name: 'sky/500',   type: 'COLOR', value: rgb('#5c9ad6') },
      { name: 'sky/700',   type: 'COLOR', value: rgb('#4274a3') },
      // Lime accent
      { name: 'lime/500',  type: 'COLOR', value: rgb('#87bc53') },
      { name: 'lime/700',  type: 'COLOR', value: rgb('#5d8e35') },
      // Purple accent
      { name: 'purple/500', type: 'COLOR', value: rgb('#9777c9') },
      { name: 'purple/700', type: 'COLOR', value: rgb('#6c50a3') },
      // Special surfaces
      { name: 'special/envelope',        type: 'COLOR', value: rgb('#e8d5a8') },
      { name: 'special/envelope-border', type: 'COLOR', value: rgb('#8b6914') },
      { name: 'special/dark',            type: 'COLOR', value: rgb('#0a0a0c') },
      // Map environment
      { name: 'map/grass-1', type: 'COLOR', value: rgb('#b9dc86') },
      { name: 'map/grass-2', type: 'COLOR', value: rgb('#8dc45b') },
      { name: 'map/grass-3', type: 'COLOR', value: rgb('#6ea342') },
      { name: 'map/path-1',  type: 'COLOR', value: rgb('#d8c78d') },
      { name: 'map/path-2',  type: 'COLOR', value: rgb('#b99f63') },
      { name: 'map/water-1', type: 'COLOR', value: rgb('#87bdd9') },
      { name: 'map/water-2', type: 'COLOR', value: rgb('#5f93b0') },
      { name: 'map/water-3', type: 'COLOR', value: rgb('#3d6884') },
      { name: 'map/roof-1',  type: 'COLOR', value: rgb('#d86f49') },
      { name: 'map/roof-2',  type: 'COLOR', value: rgb('#ab4f31') },
      { name: 'map/wall-1',  type: 'COLOR', value: rgb('#f5e9cf') },
      { name: 'map/wall-2',  type: 'COLOR', value: rgb('#e0cca6') },
      { name: 'map/shadow',  type: 'COLOR', value: { r: 0.067, g: 0.082, b: 0.075, a: 0.26 } },
    ],
  },

  // ── 2. Semantic Colors ────────────────────────────────────────────────────
  {
    id:       'col_semantic',
    name:     '🎯 Semantic',
    modeId:   'mode_semantic',
    modeName: 'Default',
    vars: [
      { name: 'color/bg',             type: 'COLOR', value: rgb('#f3f0e8') },
      { name: 'color/panel',          type: 'COLOR', value: rgb('#fcfcf8') },
      { name: 'color/panel-muted',    type: 'COLOR', value: rgb('#f4f8f5') },
      { name: 'color/border',         type: 'COLOR', value: rgb('#2b2723') },
      { name: 'color/border-soft',    type: 'COLOR', value: rgb('#c8bfae') },
      { name: 'color/text',           type: 'COLOR', value: rgb('#2b2723') },
      { name: 'color/text-muted',     type: 'COLOR', value: rgb('#786f65') },
      { name: 'color/text-inverse',   type: 'COLOR', value: rgb('#fffef8') },
      { name: 'color/primary',        type: 'COLOR', value: rgb('#2c968b') },
      { name: 'color/primary-hover',  type: 'COLOR', value: rgb('#51b7a9') },
      { name: 'color/primary-strong', type: 'COLOR', value: rgb('#195a55') },
      { name: 'color/primary-soft',   type: 'COLOR', value: rgb('#b7e2d9') },
      { name: 'color/danger',         type: 'COLOR', value: rgb('#d66683') },
      { name: 'color/danger-strong',  type: 'COLOR', value: rgb('#ab4e67') },
      { name: 'color/success',        type: 'COLOR', value: rgb('#87bc53') },
      { name: 'color/success-strong', type: 'COLOR', value: rgb('#5d8e35') },
      { name: 'color/notice',         type: 'COLOR', value: rgb('#5c9ad6') },
      { name: 'color/notice-strong',  type: 'COLOR', value: rgb('#4274a3') },
      { name: 'color/warm',           type: 'COLOR', value: rgb('#d8b04f') },
      { name: 'color/warm-strong',    type: 'COLOR', value: rgb('#a6802d') },
      { name: 'color/accent',         type: 'COLOR', value: rgb('#9777c9') },
      { name: 'color/accent-strong',  type: 'COLOR', value: rgb('#6c50a3') },
    ],
  },

  // ── 3. Typography ─────────────────────────────────────────────────────────
  {
    id:       'col_typography',
    name:     '✍️ Typography',
    modeId:   'mode_typography',
    modeName: 'Default',
    vars: [
      // Font families
      { name: 'font/pixel',  type: 'STRING', value: 'Press Start 2P' },
      { name: 'font/body',   type: 'STRING', value: 'Noto Sans SC' },
      // Font sizes (px)
      { name: 'size/xs',     type: 'FLOAT',  value: 7  },
      { name: 'size/sm',     type: 'FLOAT',  value: 8  },
      { name: 'size/base',   type: 'FLOAT',  value: 10 },
      { name: 'size/md',     type: 'FLOAT',  value: 12 },
      { name: 'size/lg',     type: 'FLOAT',  value: 14 },
      { name: 'size/xl',     type: 'FLOAT',  value: 16 },
      { name: 'size/2xl',    type: 'FLOAT',  value: 20 },
      { name: 'size/logo',   type: 'FLOAT',  value: 56 },
      // Letter spacing
      { name: 'tracking/tight',  type: 'FLOAT', value: 0  },
      { name: 'tracking/normal', type: 'FLOAT', value: 80 },  // 0.08em at 1000em base
      { name: 'tracking/wide',   type: 'FLOAT', value: 200 },
    ],
  },

  // ── 4. Spacing ────────────────────────────────────────────────────────────
  {
    id:       'col_spacing',
    name:     '📐 Spacing',
    modeId:   'mode_spacing',
    modeName: 'Default',
    vars: [
      { name: 'space/1', type: 'FLOAT', value: 4  },
      { name: 'space/2', type: 'FLOAT', value: 8  },
      { name: 'space/3', type: 'FLOAT', value: 12 },
      { name: 'space/4', type: 'FLOAT', value: 16 },
      { name: 'space/5', type: 'FLOAT', value: 20 },
      { name: 'space/6', type: 'FLOAT', value: 24 },
      { name: 'space/7', type: 'FLOAT', value: 32 },
      { name: 'space/8', type: 'FLOAT', value: 40 },
      // Layout constants
      { name: 'layout/toolbar-height', type: 'FLOAT', value: 68   },
      { name: 'layout/map-width',      type: 'FLOAT', value: 1200 },
      { name: 'layout/map-height',     type: 'FLOAT', value: 780  },
      { name: 'layout/dialog-max',     type: 'FLOAT', value: 720  },
      { name: 'layout/page-max',       type: 'FLOAT', value: 1120 },
    ],
  },

  // ── 5. Effects (borders, z-index, animation) ──────────────────────────────
  {
    id:       'col_effects',
    name:     '⚙️ Effects',
    modeId:   'mode_effects',
    modeName: 'Default',
    vars: [
      // Pixel unit
      { name: 'pixel/bit',            type: 'FLOAT', value: 4 },
      // Border widths
      { name: 'border/thin',          type: 'FLOAT', value: 2 },
      { name: 'border/base',          type: 'FLOAT', value: 3 },
      { name: 'border/thick',         type: 'FLOAT', value: 4 },
      // Z-index layer stack
      { name: 'z/map',                type: 'FLOAT', value: 1    },
      { name: 'z/toolbar',            type: 'FLOAT', value: 10   },
      { name: 'z/overlay',            type: 'FLOAT', value: 50   },
      { name: 'z/modal',              type: 'FLOAT', value: 100  },
      { name: 'z/letter',             type: 'FLOAT', value: 2000 },
      // Animation durations (ms)
      { name: 'duration/instant',     type: 'FLOAT', value: 80   },
      { name: 'duration/fast',        type: 'FLOAT', value: 120  },
      { name: 'duration/normal',      type: 'FLOAT', value: 200  },
      { name: 'duration/slow',        type: 'FLOAT', value: 400  },
      { name: 'duration/enter',       type: 'FLOAT', value: 140  },
      { name: 'duration/scene',       type: 'FLOAT', value: 1200 },
    ],
  },
];

// ── Build Figma API payload ───────────────────────────────────────────────────

function buildPayload(collections) {
  const variableCollections = [];
  const variableModes       = [];
  const variables           = [];
  const variableModeValues  = [];

  for (const col of collections) {
    variableCollections.push({
      action:        'CREATE',
      id:            col.id,
      name:          col.name,
      initialModeId: col.modeId,
    });

    variableModes.push({
      action:                'CREATE',
      id:                    col.modeId,
      name:                  col.modeName,
      variableCollectionId:  col.id,
    });

    col.vars.forEach((v, i) => {
      const varId = `${col.id}_v${i}`;

      variables.push({
        action:               'CREATE',
        id:                   varId,
        name:                 v.name,
        variableCollectionId: col.id,
        resolvedType:         v.type,
        scopes:               ['ALL_SCOPES'],
        hiddenFromPublishing: false,
      });

      variableModeValues.push({
        variableId: varId,
        modeId:     col.modeId,
        value:      v.value,
      });
    });
  }

  return { variableCollections, variableModes, variables, variableModeValues };
}

// ── Send to Figma ─────────────────────────────────────────────────────────────

async function main() {
  if (FIGMA_TOKEN === 'PASTE_NEW_TOKEN_HERE') {
    console.error('❌  Set FIGMA_TOKEN env var or replace the constant in the script.');
    process.exit(1);
  }

  const payload = buildPayload(COLLECTIONS);

  const totalVars = payload.variables.length;
  const totalCols = payload.variableCollections.length;
  console.log(`\n📦  Pushing ${totalVars} variables across ${totalCols} collections to Figma...\n`);

  const res = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/variables`,
    {
      method:  'POST',
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌  Figma API error ${res.status}: ${res.statusText}`);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅  Success! Design system created in Figma.\n');
  console.log(`   Collections : ${totalCols}`);
  console.log(`   Variables   : ${totalVars}`);

  // Print created collection IDs for reference
  if (data.meta?.variableCollections) {
    console.log('\n📋  Created collections:');
    for (const [tempId, col] of Object.entries(data.meta.variableCollections)) {
      console.log(`   ${col.name}  →  ${col.id}`);
    }
  }
}

main().catch(err => {
  console.error('❌  Unexpected error:', err);
  process.exit(1);
});
