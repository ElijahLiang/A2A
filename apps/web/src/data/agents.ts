import type { HumanSpriteType } from './humanSprites'

export interface TownAgent {
  id: string
  name: string
  status: string
  /** @deprecated 旧 LPC 层叠路径已失效；优先使用 spriteType 单帧序列 */
  layers?: string[]
  spriteType?: HumanSpriteType
  startRow: number
  startCol: number
}

export const TOWN_AGENTS: TownAgent[] = [
  {
    id: 'agent-mira',
    name: 'Mira',
    status: '去餐厅觅食中',
    spriteType: 'female',
    startRow: 4,
    startCol: 3,
  },
  {
    id: 'agent-kai',
    name: 'Kai',
    status: '前往图书馆',
    spriteType: 'male',
    startRow: 8,
    startCol: 10,
  },
  {
    id: 'agent-luca',
    name: 'Luca',
    status: '在广场闲逛',
    spriteType: 'male',
    startRow: 11,
    startCol: 6,
  },
  {
    id: 'agent-yuki',
    name: 'Yuki',
    status: '去咖啡馆坐坐',
    spriteType: 'female',
    startRow: 4,
    startCol: 12,
  },
]

export const PLAYER_AGENT: TownAgent = {
  id: 'player',
  name: '你',
  status: 'Avatar 待命中',
  spriteType: 'male',
  startRow: 8,
  startCol: 8,
}
