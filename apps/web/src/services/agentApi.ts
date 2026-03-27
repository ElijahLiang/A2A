import { apiUrl } from '../config/apiBase'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export interface AgentInfo {
  name: string
  mbti: string
  signature: string
  department: string
  lucky_place: string
  preferences: string
  gender: string
}

export interface DialogEvent {
  type: string
  dialog_id: string
  speaker: string
  receiver: string
  content: string
  emotion: string
  scene: string
  timestamp: string
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  try {
    const res = await fetchWithTimeout(apiUrl('/api/agents'))
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function fetchEvents(since: number): Promise<{ events: DialogEvent[]; nextSince: number }> {
  try {
    const res = await fetchWithTimeout(apiUrl(`/api/events?since=${since}`))
    const json = await res.json()
    return { events: json.data || [], nextSince: json.next_since || since }
  } catch {
    return { events: [], nextSince: since }
  }
}

export async function triggerDialog(agent1: string, agent2: string, scene?: string): Promise<unknown> {
  const params = new URLSearchParams({ agent1, agent2 })
  if (scene) params.set('scene', scene)
  const res = await fetchWithTimeout(apiUrl(`/api/dialog?${params}`), { method: 'POST' })
  return res.json()
}
