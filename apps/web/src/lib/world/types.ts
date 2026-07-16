import type { HumanSpriteType } from '../../data/humanSprites'
import type { SquareCat } from '../../types'
import type { MotionDirection, PixelPoint } from './motion'

export type AnimState = 'idle' | 'walk'

export type TownActorKind = 'human' | 'cat'

export interface TownActorBase {
  id: string
  kind: TownActorKind
  x: number
  y: number
  direction: MotionDirection
  animState: AnimState
  frameIndex: number
  frameElapsed: number
  /** 当前路段目标 */
  targetX: number
  targetY: number
  route: PixelPoint[]
  /** idle 等待剩余 ms */
  waitMs: number
  /** 是否参与自动行走 */
  autoWalk: boolean
  label: string
  status: string
}

export interface HumanActor extends TownActorBase {
  kind: 'human'
  spriteType: HumanSpriteType
  agentName: string
}

export interface CatActor extends TownActorBase {
  kind: 'cat'
  catType: SquareCat['type']
  activityType: SquareCat['activityType']
  /** 原始 SquareCat，点击回调用 */
  source: SquareCat
}

export type TownActor = HumanActor | CatActor
