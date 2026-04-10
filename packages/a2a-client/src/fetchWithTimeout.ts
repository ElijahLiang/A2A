/** 避免后端未启动时 fetch 长时间挂起 */
export const DEFAULT_FETCH_TIMEOUT_MS = 4000

type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number }

export async function fetchWithTimeout(input: string | URL, init: FetchWithTimeoutInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, ...rest } = init
  const c = new AbortController()
  const t = globalThis.setTimeout(() => c.abort(), timeoutMs)
  try {
    return await fetch(input, { ...rest, signal: c.signal })
  } finally {
    globalThis.clearTimeout(t)
  }
}
