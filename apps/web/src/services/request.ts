import { apiUrl } from '../config/apiBase'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(apiUrl(path), {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const json = (await res.json()) as ApiResponse<T>
    if (json.code !== 0 && json.code !== 200) throw new Error(json.message)
    return json.data
  } catch {
    console.warn(`API 调用失败: ${path}，使用本地降级`)
    return null
  }
}
