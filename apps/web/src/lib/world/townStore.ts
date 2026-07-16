import type { TownAgent } from '../../data/agents'
import type { SquareCat } from '../../types'
import {
  ARRIVE_EPSILON,
  CAT_SPEED,
  NPC_SPEED,
  WALK_FRAME_MS,
  buildLRoute,
  getDirection,
  pickAxisAlignedTarget,
  pickNeighborStep,
  toCell,
  toPixel,
} from './motion'
import type { CatActor, HumanActor, TownActor } from './types'

type Listener = () => void

let actors = new Map<string, TownActor>()
const listeners = new Set<Listener>()
let version = 0

function emit() {
  version += 1
  listeners.forEach((l) => l())
}

function advanceSegment(actor: TownActor): boolean {
  const next = actor.route.shift()
  if (!next) return false
  actor.targetX = next.x
  actor.targetY = next.y
  const dx = actor.targetX - actor.x
  const dy = actor.targetY - actor.y
  actor.direction = getDirection(dx, dy)
  actor.frameIndex = 0
  actor.frameElapsed = 0
  actor.animState = 'walk'
  return true
}

function chooseHumanTarget(actor: HumanActor) {
  const here = toCell(actor.x, actor.y)
  const target = pickAxisAlignedTarget(here)
  actor.route = buildLRoute({ x: actor.x, y: actor.y }, target)
  actor.waitMs = 2400 + Math.random() * 4200
  if (!advanceSegment(actor)) {
    actor.animState = 'idle'
  }
}

function chooseCatTarget(actor: CatActor) {
  const dest = pickNeighborStep({ x: actor.x, y: actor.y })
  actor.route = [{ x: dest.x, y: dest.y }]
  actor.waitMs = 1800 + Math.random() * 3200
  if (!advanceSegment(actor)) {
    actor.animState = 'idle'
  }
}

function stepActor(actor: TownActor, dt: number, speed: number) {
  if (!actor.autoWalk) return

  if (actor.animState === 'walk') {
    const dx = actor.targetX - actor.x
    const dy = actor.targetY - actor.y
    const dist = Math.hypot(dx, dy)

    if (dist > ARRIVE_EPSILON) {
      const step = Math.min(dist, speed * dt)
      actor.x += (dx / dist) * step
      actor.y += (dy / dist) * step
      actor.animState = 'walk'
      actor.frameElapsed += dt * 1000
      if (actor.frameElapsed >= WALK_FRAME_MS) {
        actor.frameElapsed = 0
        actor.frameIndex += 1
      }
      return
    }

    actor.x = actor.targetX
    actor.y = actor.targetY
    if (advanceSegment(actor)) return

    actor.animState = 'idle'
    actor.frameIndex = 0
    actor.frameElapsed = 0
    return
  }

  actor.waitMs -= dt * 1000
  if (actor.waitMs <= 0) {
    if (actor.kind === 'human') chooseHumanTarget(actor)
    else chooseCatTarget(actor)
  }
}

export function createHumanActor(agent: TownAgent, autoWalk = true): HumanActor {
  const pos = toPixel(agent.startRow, agent.startCol)
  return {
    id: agent.id,
    kind: 'human',
    x: pos.x,
    y: pos.y,
    targetX: pos.x,
    targetY: pos.y,
    route: [],
    direction: 'down',
    animState: 'idle',
    frameIndex: 0,
    frameElapsed: 0,
    waitMs: 2000 + Math.random() * 4000,
    autoWalk,
    label: agent.name,
    status: agent.status,
    spriteType: agent.spriteType ?? 'male',
    agentName: agent.name,
  }
}

export function createCatActor(cat: SquareCat): CatActor {
  const pos = toPixel(cat.position.row, cat.position.col)
  return {
    id: cat.id,
    kind: 'cat',
    x: pos.x,
    y: pos.y,
    targetX: pos.x,
    targetY: pos.y,
    route: [],
    direction: 'down',
    animState: 'idle',
    frameIndex: 0,
    frameElapsed: 0,
    waitMs: 400 + Math.random() * 1200,
    autoWalk: true,
    label: cat.activityType,
    status: cat.activityType,
    catType: cat.type,
    activityType: cat.activityType,
    source: cat,
  }
}

export function seedActors(humans: TownAgent[], cats: SquareCat[], player?: TownAgent) {
  actors = new Map()
  for (const h of humans) {
    actors.set(h.id, createHumanActor(h, true))
  }
  if (player) {
    actors.set(player.id, createHumanActor(player, false))
  }
  for (const c of cats) {
    actors.set(c.id, createCatActor(c))
  }
  emit()
}

export function updatePlayerPose(playerId: string, row: number, col: number) {
  const actor = actors.get(playerId)
  if (!actor || actor.kind !== 'human') return
  const pos = toPixel(row, col)
  actor.x = pos.x
  actor.y = pos.y
  actor.targetX = pos.x
  actor.targetY = pos.y
  actor.route = []
  actor.animState = 'idle'
  actor.autoWalk = false
  emit()
}

export function step(dt: number) {
  let changed = false
  for (const actor of actors.values()) {
    if (!actor.autoWalk && actor.animState === 'idle') continue
    const before = `${actor.x}|${actor.y}|${actor.animState}|${actor.frameIndex}|${actor.direction}`
    stepActor(actor, dt, actor.kind === 'cat' ? CAT_SPEED : NPC_SPEED)
    const after = `${actor.x}|${actor.y}|${actor.animState}|${actor.frameIndex}|${actor.direction}`
    if (before !== after) changed = true
  }
  if (changed) emit()
}

export function getSnapshot(): TownActor[] {
  return Array.from(actors.values())
}

export function getActor(id: string): TownActor | undefined {
  return actors.get(id)
}

export function getVersion() {
  return version
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 预留：注册用户分身加入小镇运行时 */
export function addHumanActor(agent: TownAgent) {
  if (actors.has(agent.id)) return
  actors.set(agent.id, createHumanActor(agent, true))
  emit()
}

export function clearActors() {
  actors = new Map()
  emit()
}
