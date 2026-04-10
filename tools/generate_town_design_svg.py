#!/usr/bin/env python3
"""
Generate an import-ready SVG layout for Figma Design from A2A building assets.
The SVG embeds all raster assets as data URIs so it can be moved as a single file.
"""

from __future__ import annotations

import base64
import imghdr
from pathlib import Path


ROOT = Path(r"C:/Users/l/Desktop/A2A")
ASSET_DIR = ROOT / "assets" / "building"
OUT_DIR = ROOT / "exports"
OUT_FILE = OUT_DIR / "A2A_town_design_import.svg"

# Canvas uses the latest clean map as base.
MAP_FILE = ASSET_DIR / "map.png"
CANVAS_W = 5483
CANVAS_H = 3060

# Building placements (center point + uniform scale).
# Requirements from user:
# - square in center
# - pond near edge
PLACEMENTS = [
    ("square.png", 2741, 1530, 0.48),        # central plaza
    ("pond.png", 720, 2480, 0.46),           # wishing pond near edge
    ("library.png", 940, 850, 0.72),
    ("restaurant.png", 3450, 900, 0.75),
    ("coffee shop.png", 1850, 1150, 0.78),
    ("BookStore.png", 4300, 1320, 0.76),
    ("GYM.png", 4680, 2350, 0.76),
    ("Gallery.png", 3500, 2010, 0.75),
    ("Park.png", 1420, 2480, 0.72),
]


def image_type(path: Path) -> str:
    kind = imghdr.what(path)
    if kind is None:
        suffix = path.suffix.lower()
        if suffix in {".jpg", ".jpeg"}:
            return "jpeg"
        if suffix == ".png":
            return "png"
        raise ValueError(f"Unsupported image type: {path}")
    if kind == "jpg":
        return "jpeg"
    return kind


def data_uri(path: Path) -> str:
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:image/{image_type(path)};base64,{b64}"


def write_svg() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">'
    )

    map_uri = data_uri(MAP_FILE)
    lines.append('  <g id="background">')
    lines.append(
        f'    <image x="0" y="0" width="{CANVAS_W}" height="{CANVAS_H}" '
        f'xlink:href="{map_uri}" href="{map_uri}" />'
    )
    lines.append("  </g>")

    lines.append('  <g id="buildings">')
    for filename, cx, cy, scale in PLACEMENTS:
        path = ASSET_DIR / filename
        uri = data_uri(path)

        # Raw dimensions inferred from source files.
        # We keep values explicit for deterministic output.
        if filename == "square.png":
            w, h = 2048, 1634
        elif filename == "pond.png":
            w, h = 1303, 1055
        elif filename == "library.png":
            w, h = 598, 635
        elif filename == "restaurant.png":
            w, h = 597, 643
        elif filename == "coffee shop.png":
            w, h = 533, 580
        elif filename == "BookStore.png":
            w, h = 460, 497
        elif filename == "GYM.png":
            w, h = 531, 518
        elif filename == "Gallery.png":
            w, h = 485, 508
        elif filename == "Park.png":
            w, h = 562, 568
        else:
            raise ValueError(f"Missing dimensions for {filename}")

        sw = round(w * scale, 2)
        sh = round(h * scale, 2)
        x = round(cx - sw / 2, 2)
        y = round(cy - sh / 2, 2)

        layer_id = filename.replace(" ", "_").replace(".", "_")
        lines.append(f'    <g id="{layer_id}">')
        lines.append(
            f'      <image x="{x}" y="{y}" width="{sw}" height="{sh}" '
            f'xlink:href="{uri}" href="{uri}" />'
        )
        lines.append("    </g>")
    lines.append("  </g>")
    lines.append("</svg>")

    OUT_FILE.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    write_svg()
    print(str(OUT_FILE))
