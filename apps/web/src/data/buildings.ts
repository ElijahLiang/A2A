import { type BuildingId } from '../components/Building'

export type BuildingConfig = {
  id: BuildingId
  name: string
  icon: string
  row: number
  col: number
  width?: number
  height?: number
  hint: string
  badge?: string
}

// 12列 × 10行网格，每格 100×78px，地图 1200×780px
export const BUILDINGS: BuildingConfig[] = [
  { id: 'library', name: '图书馆', icon: '📚', row: 1, col: 1, width: 2, height: 3, hint: '安静读书与学习搭子', badge: 'study' },
  { id: 'town_square', name: '广场', icon: '⛲', row: 1, col: 5, width: 4, height: 4, hint: '查看全镇活跃匹配' },
  { id: 'post_office', name: '邮局', icon: '📮', row: 1, col: 11, width: 2, height: 3, hint: '匹配通知与邀约回信', badge: '2' },
  { id: 'restaurant', name: '餐厅', icon: '🍽', row: 5, col: 1, width: 2, height: 3, hint: '饭搭子与晚餐约局', badge: 'eat' },
  { id: 'cafe', name: '咖啡馆', icon: '☕', row: 5, col: 11, width: 2, height: 3, hint: '轻松聊天与初次见面', badge: 'chat' },
  { id: 'gym', name: '运动场', icon: '🏟', row: 8, col: 1, width: 2, height: 3, hint: '晨跑、羽毛球与户外活动', badge: 'sport' },
  { id: 'arcade', name: '游戏厅', icon: '🎮', row: 8, col: 4, width: 2, height: 3, hint: '双排、桌游与轻竞技', badge: 'play' },
  { id: 'cinema', name: '电影院', icon: '🎬', row: 8, col: 8, width: 2, height: 3, hint: '电影局与映后聊天', badge: 'film' },
  { id: 'home', name: '我的小屋', icon: '🏡', row: 8, col: 11, width: 2, height: 3, hint: '人格画像与社交偏好', badge: 'me' },
]

export const INTENT_BUILDINGS: Record<
  Exclude<BuildingId, 'home' | 'post_office' | 'town_square'>,
  { activityType: string; title: string; subtitle: string }
> = {
  library: { activityType: 'study', title: '图书馆', subtitle: '发布学习、共读或安静陪伴意图' },
  restaurant: { activityType: 'dining', title: '餐厅', subtitle: '发布吃饭、探店或夜宵意图' },
  cafe: { activityType: 'coffee', title: '咖啡馆', subtitle: '发布闲聊、咖啡或下午茶意图' },
  gym: { activityType: 'sports', title: '运动场', subtitle: '发布运动、骑行或球类活动' },
  cinema: { activityType: 'movie', title: '电影院', subtitle: '发布观影、追剧或映后聊天意图' },
  arcade: { activityType: 'gaming', title: '游戏厅', subtitle: '发布游戏、桌游或开黑邀约' },
}

export function isIntentBuilding(buildingId: BuildingId): buildingId is keyof typeof INTENT_BUILDINGS {
  return buildingId in INTENT_BUILDINGS
}
