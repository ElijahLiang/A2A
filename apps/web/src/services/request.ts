import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const API_BASE = 'http://127.0.0.1:8000'

export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const json = (await res.json()) as ApiResponse<T>
    if (json.code !== 0) throw new Error(json.message)
    return json.data
  } catch {
    console.warn(`API 调用失败: ${path}，使用本地降级`)
    return null
  }
}
