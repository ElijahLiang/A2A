import type { SquareCat } from '../types'

/** 离线默认：广场猫咪占位（API 失败时使用） */
export const MOCK_PLAZA_CATS: SquareCat[] = [
  {
    id: 'plaza-cat-1',
    type: 'orange',
    activityType: 'coffee',
    position: { row: 4, col: 6 },
    appearsAt: Date.now(),
    expiresAt: Date.now() + 86400000 * 7,
  },
  {
    id: 'plaza-cat-2',
    type: 'black',
    activityType: 'study',
    position: { row: 3, col: 7 },
    appearsAt: Date.now(),
    expiresAt: Date.now() + 86400000 * 7,
  },
]
