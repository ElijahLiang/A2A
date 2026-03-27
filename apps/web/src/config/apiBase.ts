/**
 * API 根路径。
 * - 开发 (pnpm dev)：返回空字符串，请求走相对路径 `/api/...`，由 Vite 代理到后端，避免跨域与系统代理干扰。
 * - 生产：若由 FastAPI 同机同端口提供前端，仍可用相对路径；否则设置 VITE_API_BASE。
 */
export function getApiBase(): string {
  const v = import.meta.env.VITE_API_BASE as string | undefined
  if (v?.trim()) return v.replace(/\/$/, '')
  if (import.meta.env.DEV) return ''
  return ''
}

/** 拼出完整请求 URL（开发模式下为同源相对路径，走 Vite 代理） */
export function apiUrl(path: string): string {
  const b = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return b ? `${b}${p}` : p
}
