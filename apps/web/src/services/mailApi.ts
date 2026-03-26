import { request } from './request'
import type { Letter } from '../types'

export async function fetchMailRemote(userId: string, since = 0): Promise<Letter[] | null> {
  return request<Letter[]>(`/api/mail?userId=${encodeURIComponent(userId)}&since=${since}`)
}

export type MailCreateBody = Omit<Letter, 'id' | 'createdAt' | 'expiresAt'> & {
  id?: string
  createdAt?: number
  expiresAt?: number
}

export async function sendMailRemote(body: MailCreateBody): Promise<{ id: string } | null> {
  return request<{ id: string }>('/api/mail', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function markMailReadRemote(id: string): Promise<boolean> {
  const r = await request<unknown>(`/api/mail/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
  return r !== null
}
