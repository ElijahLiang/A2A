import { type BuildingId } from '../components/Building'

export type BuildingConfig = {
  id: BuildingId
  name: string
  icon: string
  x: number
  y: number
  scale?: number
  hint: string
  badge?: string
}

// 地图逻辑尺寸 1376 × 768，背景图 map-full.jpg 为 2× 分辨率（2752×1536）
// x/y 为建筑落点的底部中心坐标，已对齐全景地图背景
export const BUILDINGS: BuildingConfig[] = [
  { id: 'library',     name: '图书馆', icon: '📚', x:  268, y:  571, scale: 0.227, hint: 'library',    badge: 'study' },
  { id: 'cafe',        name: '咖啡店', icon: '☕',  x:  481, y:  384, scale: 0.250, hint: 'coffee shop', badge: 'chat'  },
  { id: 'restaurant',  name: '餐厅',   icon: '🍽',  x:  858, y:  252, scale: 0.250, hint: 'restaurant', badge: 'eat'   },
  { id: 'town_square', name: '广场',   icon: '⛲',  x:  685, y:  479, scale: 0.135, hint: 'square' },
  { id: 'post_office', name: '许愿池', icon: '💧',  x:  159, y:  672, scale: 0.096, hint: 'pond' },
  { id: 'arcade',      name: '书店',   icon: '📚',  x: 1190, y:  462, scale: 0.261, hint: 'BookStore',  badge: 'read'  },
  { id: 'gym',         name: '健身房', icon: '🏟',  x: 1212, y:  706, scale: 0.260, hint: 'GYM',        badge: 'sport' },
  { id: 'home',        name: '公园',   icon: '🌳',  x:  221, y:  243, scale: 0.366, hint: 'Park',       badge: 'park'  },
  { id: 'cinema',      name: '画廊',   icon: '🖼',  x:  948, y:  520, scale: 0.249, hint: 'Gallery',    badge: 'art'   },
]

export const INTENT_BUILDINGS: Record<
  Exclude<BuildingId, 'home' | 'post_office' | 'town_square'>,
  { activityType: string; title: string; subtitle: string }
> = {
  library: { activityType: 'study', title: '图书馆', subtitle: '发布学习、共读或安静陪伴意图' },
  restaurant: { activityType: 'dining', title: '餐厅', subtitle: '发布吃饭、探店或夜宵意图' },
  cafe: { activityType: 'coffee', title: '咖啡店', subtitle: '发布闲聊、咖啡或轻松会面意图' },
  gym: { activityType: 'sports', title: '健身房', subtitle: '发布运动、训练或户外活动意图' },
  cinema: { activityType: 'gallery', title: '画廊', subtitle: '发布逛展、创作或看作品意图' },
  arcade: { activityType: 'bookstore', title: '书店', subtitle: '发布淘书、共读或安静停留意图' },
}

export function isIntentBuilding(buildingId: BuildingId): buildingId is keyof typeof INTENT_BUILDINGS {
  return buildingId in INTENT_BUILDINGS
}
