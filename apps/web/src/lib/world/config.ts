/** 小镇世界坐标：唯一事实来源 */

export const MAP_W = 1376
export const MAP_H = 768
export const TILE = 64

/** 角色脚底不超出地图 */
export const MAX_ROW = Math.floor(MAP_H / TILE) // 12
export const MAX_COL = Math.floor(MAP_W / TILE) // 21
