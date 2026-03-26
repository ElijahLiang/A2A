// 全局数据模型 — 与 .cursorrules 2.3 对齐

// ============ 用户 & Agent ============

export interface User {
  id: string
  phone: string
  bio: string
  avatarColor: 'blue' | 'green'
  agentName: string
  createdAt: number
}

// ============ Token ============

export interface TokenRecord {
  id: string
  type: 'earn' | 'spend'
  amount: number
  reason: TokenReason
  relatedId?: string
  timestamp: number
}

export const TOKEN_REASONS = {
  REGISTER_BONUS: 'register_bonus',
  MEETUP_SUCCESS: 'meetup_success',
  PHOTO_TAKEN: 'photo_taken',
  WISH_COMPLETE: 'wish_complete',
  SEASON_TASK: 'season_task',
  LOGIN_STREAK: 'login_streak',
  NOSHOW_COMPENSATE: 'noshow_compensate',
  PUBLISH_DUO: 'publish_duo',
  PUBLISH_GROUP: 'publish_group',
  PUBLISH_OPEN: 'publish_open',
  WISH_SUBMIT: 'wish_submit',
  FURNITURE_BUY: 'furniture_buy',
  VENUE_UNLOCK: 'venue_unlock',
  NOSHOW_PENALTY: 'noshow_penalty',
  EXPIRED_REFUND: 'expired_refund',
} as const

export type TokenReason = (typeof TOKEN_REASONS)[keyof typeof TOKEN_REASONS]

// ============ 活动 ============

export type ActivityStatus =
  | 'recruiting'
  | 'matched'
  | 'confirmed'
  | 'completed'
  | 'expired'
  | 'cancelled'

export interface Activity {
  id: string
  publisherId: string
  venueId: string
  activityType: string
  description: string
  time: string
  location: string
  groupSize: '2' | '3-5' | 'unlimited'
  mood: string
  note?: string
  status: ActivityStatus
  tokenCost: number
  applicants: string[]
  confirmedUsers: string[]
  createdAt: number
  expiresAt: number
}

// ============ 信件 ============

export type LetterStatus = 'unread' | 'read' | 'replied' | 'archived' | 'expired'

export interface Letter {
  id: string
  activityId: string
  fromUserId: string
  toUserId: string
  content: string
  mood?: string
  round: number
  status: LetterStatus
  createdAt: number
  expiresAt: number
}

// ============ 会面 ============

export type MeetupStatus = 'pending' | 'verified' | 'noshow_one' | 'noshow_both' | 'completed'

export interface Meetup {
  id: string
  activityId: string
  participants: string[]
  scheduledTime: number
  location: string
  verifyMethod: 'qrcode' | 'gps' | 'nfc'
  status: MeetupStatus
  verifiedAt?: number
  photoId?: string
}

// ============ 邮戳 ============

export type StampGrade = 'bronze' | 'silver' | 'gold' | 'rainbow'

export interface Stamp {
  id: string
  ownerId: string
  venueId: string
  activityType: string
  partnerId: string
  grade: StampGrade
  earnedAt: number
  meetupId: string
  isSeasonal: boolean
  seasonId?: string
}

// ============ 小屋 ============

export interface FurnitureItem {
  id: string
  name: string
  unlockCondition: string
  unlockCheck: string
  effect?: string
  sprite: string
}

export interface PixelHome {
  ownerId: string
  level: number
  furniture: string[]
  visitors: number
}

// ============ 好友 ============

export interface Friend {
  userId: string
  friendId: string
  addedAt: number
  source: 'meetup' | 'wish'
}

// ============ 许愿池 ============

export type WishStatus =
  | 'floating'
  | 'picked'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'expired'

export interface Wish {
  id: string
  authorId: string
  content: string
  status: WishStatus
  pickerId?: string
  completedAt?: number
  createdAt: number
}

// ============ 赛季 ============

export interface SeasonTask {
  id: string
  description: string
  target: number
  reward: { token: number; stampId?: string; title?: string }
}

export interface Season {
  id: string
  name: string
  theme: string
  startDate: number
  endDate: number
  tasks: SeasonTask[]
  limitedStamps: string[]
  limitedCats: string[]
  limitedFurniture: string
}

// ============ 猫咪 ============

export type CatType = 'orange' | 'black' | 'white' | 'calico' | 'hidden'

export interface SquareCat {
  id: string
  type: CatType
  activityType: string
  carriedActivityId?: string
  position: { row: number; col: number }
  appearsAt: number
  expiresAt: number
}
