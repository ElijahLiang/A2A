import { useTownActor } from './useTownActor'
import type { Direction, AnimState } from '../components/SpriteCharacter'
import { toPixel } from '../lib/world'

export interface WalkerState {
  x: number
  y: number
  direction: Direction
  animState: AnimState
  frameIndex: number
}

/** 兼容旧 API：按起始格查找最近 actor 不可靠，改为占位 idle */
export function useAgentWalker(startRow: number, startCol: number): WalkerState {
  void startRow
  void startCol
  const pos = toPixel(startRow, startCol)
  const actor = useTownActor('__none__')
  void actor
  return {
    x: pos.x,
    y: pos.y,
    direction: 'down',
    animState: 'idle',
    frameIndex: 0,
  }
}
