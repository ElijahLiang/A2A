export interface TownAgent {
  id: string
  name: string
  status: string
  layers: string[]
  startRow: number
  startCol: number
}

export const TOWN_AGENTS: TownAgent[] = [
  {
    id: 'agent-mira',
    name: 'Mira',
    status: '去餐厅觅食中',
    layers: [
      '/sprites/body.png',
      '/sprites/shoes.png',
      '/sprites/pants.png',
      '/sprites/shirt.png',
      '/sprites/hair-bob.png',
    ],
    startRow: 4,
    startCol: 3,
  },
  {
    id: 'agent-kai',
    name: 'Kai',
    status: '前往图书馆',
    layers: [
      '/sprites/body.png',
      '/sprites/shoes.png',
      '/sprites/pants.png',
      '/sprites/shirt.png',
      '/sprites/hair-dapper.png',
    ],
    startRow: 8,
    startCol: 10,
  },
  {
    id: 'agent-luca',
    name: 'Luca',
    status: '在广场闲逛',
    layers: [
      '/sprites/body.png',
      '/sprites/shoes.png',
      '/sprites/pants.png',
      '/sprites/shirt.png',
      '/sprites/hair-dapper.png',
      '/sprites/hat-cowboy.png',
    ],
    startRow: 11,
    startCol: 6,
  },
  {
    id: 'agent-yuki',
    name: 'Yuki',
    status: '去咖啡馆坐坐',
    layers: [
      '/sprites/body.png',
      '/sprites/shoes.png',
      '/sprites/pants.png',
      '/sprites/shirt.png',
      '/sprites/hair-bob.png',
    ],
    startRow: 4,
    startCol: 12,
  },
]

export const PLAYER_AGENT: TownAgent = {
  id: 'player',
  name: '你',
  status: 'Avatar 待命中',
  layers: [
    '/sprites/body.png',
    '/sprites/shoes.png',
    '/sprites/pants.png',
    '/sprites/shirt.png',
    '/sprites/hair-dapper.png',
  ],
  startRow: 8,
  startCol: 8,
}
