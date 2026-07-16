import { PLAYER_AGENT, TOWN_AGENTS, type TownAgent } from './agents'
import type { SquareCat } from '../types'
import { addHumanActor } from '../lib/world'

/** 额外注册的用户分身（数据层） */
const userAgents: TownAgent[] = []

/** NPC + 已注册用户分身（不含玩家站桩 Avatar） */
export function listTownAgents(): TownAgent[] {
  return [...TOWN_AGENTS, ...userAgents]
}

export function getPlayerAgent(): TownAgent {
  return PLAYER_AGENT
}

/** 注册用户分身：写入列表并同步进 town store（若 loop 已运行） */
export function appendUserAgent(agent: TownAgent) {
  if (userAgents.some((a) => a.id === agent.id) || TOWN_AGENTS.some((a) => a.id === agent.id)) return
  userAgents.push(agent)
  addHumanActor(agent)
}

/** 小镇种子：人类 NPC / 玩家 / 猫 */
export function listTownActors(cats: SquareCat[] = []) {
  return {
    humans: listTownAgents(),
    player: getPlayerAgent(),
    cats,
  }
}

/** @deprecated 使用 listTownActors */
export const listTownActorsSeed = listTownActors
