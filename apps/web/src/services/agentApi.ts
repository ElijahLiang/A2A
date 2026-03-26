import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const API_BASE = 'http://127.0.0.1:8000'

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
    const res = await fetchWithTimeout(`${API_BASE}/api/agents`)
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function fetchEvents(since: number): Promise<{ events: DialogEvent[]; nextSince: number }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/events?since=${since}`)
    const json = await res.json()
    return { events: json.data || [], nextSince: json.next_since || since }
  } catch {
    return { events: [], nextSince: since }
  }
}

export async function triggerDialog(agent1: string, agent2: string, scene?: string): Promise<unknown> {
  const params = new URLSearchParams({ agent1, agent2 })
  if (scene) params.set('scene', scene)
  const res = await fetchWithTimeout(`${API_BASE}/api/dialog?${params}`, { method: 'POST' })
  return res.json()
}
