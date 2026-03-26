import type { Season } from '../types'

/** 默认赛季（离线 / 后端未就绪时使用） */
export function getDefaultSeason(): Season {
  const now = Date.now()
  return {
    id: 'season-spring',
    name: '春季相遇',
    theme: 'teal',
    startDate: now - 86400000 * 7,
    endDate: now + 86400000 * 30,
    tasks: [
      { id: 'meet-once', description: '完成 1 次线下会面', target: 1, reward: { token: 1 } },
      { id: 'stamps-3', description: '收集 3 枚邮戳', target: 3, reward: { token: 2, title: '集邮入门' } },
    ],
    limitedStamps: ['limited-spring-1'],
    limitedCats: ['orange'],
    limitedFurniture: 'sofa-spring',
  }
}
