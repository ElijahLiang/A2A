// ─────────────────────────────────────────────────────────────────────────────
// A2A Design System — Figma Plugin
// Writes all design tokens as Figma Variables (Collections + Modes + Values)
//
// 5 Collections:
//   🎨 Primitives  — raw color palette (teal / paper / ink / accent / map)
//   🎯 Semantic    — semantic color aliases (primary / danger / text …)
//   ✍️ Typography  — font families + size scale
//   📐 Spacing     — space/1~8 + layout constants
//   ⚙️ Effects     — border widths / z-index layers / animation durations
// ─────────────────────────────────────────────────────────────────────────────

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

const COLLECTIONS = [

  // ── 1. Primitives (raw palette) ─────────────────────────────────────────
  {
    name:     '🎨 Primitives',
    modeName: 'Default',
    vars: [
      // Teal — primary brand color (10 steps)
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

      // Paper — warm white neutrals (5 steps)
      { name: 'paper/0',   type: 'COLOR', value: rgb('#fffef8') },
      { name: 'paper/100', type: 'COLOR', value: rgb('#fcfcf8') },
      { name: 'paper/200', type: 'COLOR', value: rgb('#f3f0e8') },
      { name: 'paper/300', type: 'COLOR', value: rgb('#dfd9cb') },
      { name: 'paper/400', type: 'COLOR', value: rgb('#c8bfae') },

      // Ink — dark neutrals (4 steps)
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

      // Map environment palette
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

  // ── 2. Semantic (purpose-driven aliases) ────────────────────────────────
  {
    name:     '🎯 Semantic',
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

  // ── 3. Typography ────────────────────────────────────────────────────────
  {
    name:     '✍️ Typography',
    modeName: 'Default',
    vars: [
      // Font families
      { name: 'font/pixel', type: 'STRING', value: 'Press Start 2P' },
      { name: 'font/body',  type: 'STRING', value: 'Noto Sans SC'   },

      // Size scale (px)
      { name: 'size/xs',   type: 'FLOAT', value: 7  },
      { name: 'size/sm',   type: 'FLOAT', value: 8  },
      { name: 'size/base', type: 'FLOAT', value: 10 },
      { name: 'size/md',   type: 'FLOAT', value: 12 },
      { name: 'size/lg',   type: 'FLOAT', value: 14 },
      { name: 'size/xl',   type: 'FLOAT', value: 16 },
      { name: 'size/2xl',  type: 'FLOAT', value: 20 },
      { name: 'size/logo', type: 'FLOAT', value: 56 },

      // Line heights
      { name: 'leading/tight',  type: 'FLOAT', value: 1.3 },
      { name: 'leading/normal', type: 'FLOAT', value: 1.6 },
      { name: 'leading/loose',  type: 'FLOAT', value: 1.8 },
    ],
  },

  // ── 4. Spacing ───────────────────────────────────────────────────────────
  {
    name:     '📐 Spacing',
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

  // ── 5. Effects (borders / z-index / animation) ───────────────────────────
  {
    name:     '⚙️ Effects',
    modeName: 'Default',
    vars: [
      // Pixel grid unit
      { name: 'pixel/bit',        type: 'FLOAT', value: 4 },

      // Border widths
      { name: 'border/thin',      type: 'FLOAT', value: 2 },
      { name: 'border/base',      type: 'FLOAT', value: 3 },
      { name: 'border/thick',     type: 'FLOAT', value: 4 },

      // Z-index layer stack
      { name: 'z/map',            type: 'FLOAT', value: 1    },
      { name: 'z/toolbar',        type: 'FLOAT', value: 10   },
      { name: 'z/overlay',        type: 'FLOAT', value: 50   },
      { name: 'z/modal',          type: 'FLOAT', value: 100  },
      { name: 'z/letter',         type: 'FLOAT', value: 2000 },

      // Animation durations (ms)
      { name: 'duration/instant', type: 'FLOAT', value: 80   },
      { name: 'duration/fast',    type: 'FLOAT', value: 120  },
      { name: 'duration/normal',  type: 'FLOAT', value: 200  },
      { name: 'duration/slow',    type: 'FLOAT', value: 400  },
      { name: 'duration/enter',   type: 'FLOAT', value: 140  },
      { name: 'duration/scene',   type: 'FLOAT', value: 1200 },
    ],
  },
];

// ── Plugin entry point ────────────────────────────────────────────────────────

(function main() {
  let totalCollections = 0;
  let totalVariables   = 0;
  const errors         = [];

  for (const colDef of COLLECTIONS) {
    try {
      // Create collection
      const collection = figma.variables.createVariableCollection(colDef.name);
      const modeId     = collection.defaultModeId;

      // Rename the auto-created default mode
      collection.renameMode(modeId, colDef.modeName);
      totalCollections++;

      // Create each variable and set its value
      for (const varDef of colDef.vars) {
        try {
          const variable = figma.variables.createVariable(
            varDef.name,
            collection.id,
            varDef.type
          );
          variable.setValueForMode(modeId, varDef.value);
          totalVariables++;
        } catch (e) {
          errors.push(`  [${colDef.name}] ${varDef.name}: ${e.message}`);
        }
      }
    } catch (e) {
      errors.push(`Collection "${colDef.name}": ${e.message}`);
    }
  }

  // Report results
  if (errors.length === 0) {
    figma.notify(
      `✅ A2A Design System: ${totalCollections} collections, ${totalVariables} variables created!`,
      { timeout: 5000 }
    );
  } else {
    figma.notify(
      `⚠️ Done with ${errors.length} error(s) — check console`,
      { error: true, timeout: 5000 }
    );
    console.error('Errors:\n' + errors.join('\n'));
  }

  figma.closePlugin();
})();
