/**
 * Agent Garden 风格运动：轴对齐 L 形路段 + 主轴方向判定。
 */

import { MAP_H, MAP_W, MAX_COL, MAX_ROW, TILE } from './config'

export type MotionDirection = 'down' | 'up' | 'left' | 'right'

export const NPC_SPEED = 34 // px/s
export const CAT_SPEED = 28 // px/s
export const WALK_FRAME_MS = 220
export const ARRIVE_EPSILON = 1.5

export type PathNode = { row: number; col: number }
export type PixelPoint = { x: number; y: number }

const PATH_NODES: PathNode[] = []
for (let col = 1; col <= Math.min(15, MAX_COL); col++) {
  PATH_NODES.push({ row: 4, col })
  PATH_NODES.push({ row: 8, col })
  if (11 <= MAX_ROW) PATH_NODES.push({ row: 11, col })
}
for (let row = 1; row <= MAX_ROW; row++) {
  PATH_NODES.push({ row, col: 6 })
  PATH_NODES.push({ row, col: 10 })
}

const uniqueKey = (n: PathNode) => `${n.row}-${n.col}`

export const UNIQUE_PATH_NODES: PathNode[] = Array.from(
  new Map(PATH_NODES.map((n) => [uniqueKey(n), n])).values(),
)

export function toPixel(row: number, col: number): PixelPoint {
  return { x: (col - 1) * TILE, y: (row - 1) * TILE }
}

export function toCell(x: number, y: number): PathNode {
  return {
    row: Math.min(MAX_ROW, Math.max(1, Math.round(y / TILE) + 1)),
    col: Math.min(MAX_COL, Math.max(1, Math.round(x / TILE) + 1)),
  }
}

export function clampPixel(p: PixelPoint): PixelPoint {
  return {
    x: Math.min(MAP_W - TILE, Math.max(0, p.x)),
    y: Math.min(MAP_H - TILE, Math.max(0, p.y)),
  }
}

export function getDirection(dx: number, dy: number): MotionDirection {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

/** 先水平再垂直的 L 形路径（每段单轴，方向稳定）。 */
export function buildLRoute(from: PixelPoint, targetNode: PathNode): PixelPoint[] {
  const here = toCell(from.x, from.y)
  const route: PixelPoint[] = []
  if (here.col !== targetNode.col) {
    route.push(toPixel(here.row, targetNode.col))
  }
  if (here.row !== targetNode.row) {
    route.push(toPixel(targetNode.row, targetNode.col))
  }
  return route.map(clampPixel)
}

export function pickAxisAlignedTarget(here: PathNode, nodes: PathNode[] = UNIQUE_PATH_NODES): PathNode {
  const axisCandidates = nodes.filter(
    (n) => (n.row === here.row || n.col === here.col) && !(n.row === here.row && n.col === here.col),
  )
  const pool = axisCandidates.length > 0 ? axisCandidates : nodes
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 猫：四邻格随机一步（像素目标）。 */
export function pickNeighborStep(from: PixelPoint): PixelPoint {
  const here = toCell(from.x, from.y)
  const candidates = [
    { row: here.row - 1, col: here.col },
    { row: here.row + 1, col: here.col },
    { row: here.row, col: here.col - 1 },
    { row: here.row, col: here.col + 1 },
  ].filter((m) => m.row >= 1 && m.row <= MAX_ROW && m.col >= 1 && m.col <= Math.min(12, MAX_COL))
  if (candidates.length === 0) return from
  const next = candidates[Math.floor(Math.random() * candidates.length)]
  return clampPixel(toPixel(next.row, next.col))
}
