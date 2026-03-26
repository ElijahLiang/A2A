import type { FurnitureItem } from '../types'

export const FURNITURE_CATALOG: FurnitureItem[] = [
  {
    id: 'sofa-spring',
    name: '春限沙发',
    unlockCondition: '春季赛季限定',
    unlockCheck: 'season_item',
    effect: '小屋访客 +1 展示权重',
    sprite: '/furniture/sofa.png',
  },
  {
    id: 'desk-basic',
    name: '像素书桌',
    unlockCondition: '完成首次会面',
    unlockCheck: 'meetup_once',
    effect: '展示最近访客',
    sprite: '/furniture/desk.png',
  },
  {
    id: 'lamp-teal',
    name: '青釉台灯',
    unlockCondition: '小屋等级 ≥ 3',
    unlockCheck: 'home_level_3',
    sprite: '/furniture/lamp.png',
  },
]
