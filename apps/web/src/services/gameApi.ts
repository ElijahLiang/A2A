import type { PixelHome, Season, SquareCat, Stamp, Wish } from '../types'
import { request } from './request'

export async function fetchStampsRemote(userId: string): Promise<Stamp[] | null> {
  return request<Stamp[]>(`/api/stamps?userId=${encodeURIComponent(userId)}`)
}

export async function fetchHomeRemote(userId: string): Promise<PixelHome | null> {
  return request<PixelHome>(`/api/home/${encodeURIComponent(userId)}`)
}

export async function fetchSeasonRemote(): Promise<Season | null> {
  return request<Season>('/api/season/current')
}

export async function fetchCatsRemote(): Promise<SquareCat[] | null> {
  return request<SquareCat[]>('/api/cats')
}

export async function postWishRemote(content: string): Promise<{ id: string } | null> {
  return request<{ id: string }>('/api/wish', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function fetchRandomWishRemote(): Promise<Wish | null> {
  return request<Wish>('/api/wish/random')
}
