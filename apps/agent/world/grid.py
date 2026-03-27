"""12x10 网格与建筑入口。"""

# 建筑 id -> 网格入口 (col, row)
BUILDING_ENTRANCE: dict[str, tuple[int, int]] = {
    "cafe": (6, 5),
    "library": (2, 4),
    "art_studio": (10, 3),
    "debate_hall": (8, 8),
    "psych_center": (4, 8),
    "square": (6, 6),
}

GRID_COLS = 12
GRID_ROWS = 10

BUILDING_LABEL: dict[str, str] = {
    "cafe": "咖啡馆",
    "library": "图书馆",
    "art_studio": "艺术工作室",
    "debate_hall": "辩论厅",
    "psych_center": "心理中心",
    "square": "小镇广场",
}


def building_display(building_id: str) -> str:
    return BUILDING_LABEL.get(building_id, building_id)
