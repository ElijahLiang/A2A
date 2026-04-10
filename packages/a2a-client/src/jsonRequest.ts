import { fetchWithTimeout } from './fetchWithTimeout'

export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export function createJsonRequest(deps: { resolveUrl: (path: string) => string }) {
  async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
    try {
      const res = await fetchWithTimeout(deps.resolveUrl(path), {
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
  return { request }
}
