import { memo, useEffect, useRef, useState } from 'react'
import { Building, type BuildingId } from './Building'
import { AgentSprite } from './AgentSprite'
import { PLAYER_AGENT, type TownAgent } from '../data/agents'
import { listTownAgents } from '../data/townActors'
import { useAgentEvents } from '../hooks/useAgentEvents'
import type { BuildingConfig } from '../data/buildings'
import type { SquareCat } from '../types'
import { CatSprite } from './CatSprite'
import {
  MAP_H,
  MAP_W,
  TILE,
  clearActors,
  seedActors,
  startTownLoop,
  stopTownLoop,
  updatePlayerPose,
} from '../lib/world'
import './PixelMap.css'

type PixelMapProps = {
  buildings: BuildingConfig[]
  cats?: SquareCat[]
  activeBuilding: BuildingId | null
  onBuildingClick: (buildingId: BuildingId) => void
  onCatClick?: (cat: SquareCat) => void
  onAgentClick?: (agent: TownAgent) => void
  style?: React.CSSProperties
}

export const PixelMap = memo(function PixelMap({
  buildings,
  cats = [],
  activeBuilding,
  onBuildingClick,
  onCatClick,
  onAgentClick,
  style,
}: PixelMapProps) {
  const bubbles = useAgentEvents()
  const [camera] = useState({ tx: 0, ty: 0, scale: 1 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)
  const agents = listTownAgents()

  useEffect(() => {
    seedActors(agents, cats, PLAYER_AGENT)
    startTownLoop()
    return () => {
      stopTownLoop()
      clearActors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.map((c) => c.id).join(','), agents.map((a) => a.id).join(',')])

  const handleBuildingClick = (id: BuildingId) => {
    const b = buildings.find((x) => x.id === id)
    if (b) {
      const rowC = Math.max(1, Math.round((b.y - 24) / TILE))
      const colC = Math.max(1, Math.round(b.x / TILE))
      updatePlayerPose(PLAYER_AGENT.id, rowC, colC)
    }
    onBuildingClick(id)
  }

  const getBubble = (name: string) => {
    const b = bubbles.find((x) => x.agentName === name)
    return b ? { content: b.content, emotion: b.emotion } : null
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      setFitScale(Math.max(w / MAP_W, h / MAP_H))
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => ro.disconnect()
  }, [])

  return (
    <div className="pixel-map-shell" style={style}>
      <div ref={viewportRef} className="pixel-map-viewport">
        <div className="pixel-map-scale-inner" style={{ transform: `scale(${fitScale})` }}>
          <div
            className="pixel-map pixel-map--camera"
            style={{
              transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`,
            }}
          >
            {buildings.map((b) => (
              <Building key={b.id} {...b} active={b.id === activeBuilding} onClick={handleBuildingClick} />
            ))}

            {cats.map((cat) => (
              <CatSprite key={cat.id} cat={cat} onClick={onCatClick} />
            ))}

            {agents.map((agent) => {
              const bubble = getBubble(agent.name)
              return (
                <AgentSprite
                  key={agent.id}
                  agent={agent}
                  autoWalk
                  dialogBubble={bubble?.content}
                  dialogEmotion={bubble?.emotion}
                  onClick={onAgentClick ? () => onAgentClick(agent) : undefined}
                />
              )
            })}

            <AgentSprite agent={PLAYER_AGENT} autoWalk={false} />
          </div>
        </div>
      </div>
    </div>
  )
})
