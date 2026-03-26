import type { StampGrade } from '../types'

export const STAMP_GRADE_LABEL: Record<StampGrade, string> = {
  bronze: '铜',
  silver: '银',
  gold: '金',
  rainbow: '彩虹',
}

export const VENUE_LABEL: Record<string, string> = {
  library: '图书馆',
  post_office: '邮局',
  restaurant: '餐厅',
  town_square: '广场',
  cafe: '咖啡馆',
  gym: '运动场',
  cinema: '电影院',
  arcade: '游戏厅',
  home: '我的小屋',
}
