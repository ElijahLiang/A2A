import { request } from './request'
import type { Activity, ActivityStatus } from '../types'

/** POST /api/activity 请求体（无 id，无 applicants） */
export type ActivityCreateBody = Pick<
  Activity,
  | 'publisherId'
  | 'venueId'
  | 'activityType'
  | 'description'
  | 'time'
  | 'location'
  | 'groupSize'
  | 'mood'
  | 'tokenCost'
  | 'createdAt'
  | 'expiresAt'
> & {
  note?: string
  status: ActivityStatus
}

export async function publishActivity(body: ActivityCreateBody): Promise<{ id: string } | null> {
  return request<{ id: string }>('/api/activity', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
