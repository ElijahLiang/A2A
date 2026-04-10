import { fetchWithTimeout } from '@a2a/client'
import { apiUrl } from '../config/apiBase'
import { request } from './request'
import type { Letter, LetterStatus } from '../types'

type AgentLetterRow = {
  id: string
  from_agent: string | null
  letter_type: string
  subject: string | null
  content: string
  related_agent: string | null
  status: string
  created_at: string
  expires_at: string
}

function mapAgentLetterToLetter(row: AgentLetterRow, toUserId: string): Letter {
  const subject = row.subject?.trim()
  const body = subject ? `${subject}\n${row.content}` : row.content
  const st = row.status as LetterStatus | string
  const status: LetterStatus =
    st === 'unread' || st === 'read' || st === 'replied' || st === 'archived' || st === 'expired'
      ? st
      : st === 'accepted' || st === 'declined'
        ? 'read'
        : 'unread'

  return {
    id: row.id,
    activityId: row.letter_type || 'friendship_invite',
    fromUserId: row.from_agent ?? 'agent',
    toUserId,
    content: body,
    mood: '#51b7a9',
    round: 1,
    status,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
  }
}

export async function fetchMailRemote(userId: string, _since = 0): Promise<Letter[] | null> {
  try {
    const res = await fetchWithTimeout(apiUrl(`/api/letters/${encodeURIComponent(userId)}`), {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = (await res.json()) as { code: number; data: AgentLetterRow[] }
    if (json.code !== 0 && json.code !== 200) return null
    const rows = json.data ?? []
    return rows.map((r) => mapAgentLetterToLetter(r, userId))
  } catch {
    return null
  }
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

export async function acceptInviteRemote(userId: string, letterId: string): Promise<unknown | null> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/letters/accept'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, letter_id: letterId }),
    })
    const json = (await res.json()) as { code: number; data: unknown }
    if (json.code !== 0 && json.code !== 200) return null
    return json.data
  } catch {
    return null
  }
}
