import { createJsonRequest, type ApiResponse } from '@a2a/client'
import { apiUrl } from '../config/apiBase'

export type { ApiResponse }

const { request } = createJsonRequest({ resolveUrl: apiUrl })
export { request }
