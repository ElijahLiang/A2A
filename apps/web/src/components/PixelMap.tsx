import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Building, type BuildingId } from './Building'
import { AgentSprite } from './AgentSprite'
import { LetterDialog } from './LetterDialog'
import { TOWN_AGENTS, PLAYER_AGENT, type TownAgent } from '../data/agents'
import { useAgentEvents } from '../hooks/useAgentEvents'
import type { BuildingConfig } from '../data/buildings'
import type { SquareCat } from '../types'
import { CatSprite } from './CatSprite'
import './PixelMap.css'

const MAP_W = 1376
const MAP_H = 768
const TILE = 64

type PixelMapProps = {
  buildings: BuildingConfig[]
  cats?: SquareCat[]
  activeBuilding: BuildingId | null
  onBuildingClick: (buildingId: BuildingId) => void
  onCatClick?: (cat: SquareCat) => void
  style?: React.CSSProperties
}

export const PixelMap = memo(function PixelMap({
  buildings,
  cats = [],
  activeBuilding,
  onBuildingClick,
  onCatClick,
  style,
}: PixelMapProps) {
  const bubbles = useAgentEvents()
  const [letterAgent, setLetterAgent] = useState<TownAgent | null>(null)
  const [playerRow, setPlayerRow] = useState(PLAYER_AGENT.startRow)
  const [playerCol, setPlayerCol] = useState(PLAYER_AGENT.startCol)
  const [camera] = useState({ tx: 0, ty: 0, scale: 1 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)

  const playerAgent = useMemo(
    () => ({ ...PLAYER_AGENT, startRow: playerRow, startCol: playerCol }),
    [playerRow, playerCol],
  )

  const handleBuildingClick = (id: BuildingId) => {
    const b = buildings.find((x) => x.id === id)
    if (b) {
      const rowC = Math.max(1, Math.round((b.y - 24) / TILE))
      const colC = Math.max(1, Math.round(b.x / TILE))
      setPlayerRow(rowC)
      setPlayerCol(colC)
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
      // 用 cover 逻辑：取 width/height 中较大的 scale，让地图填满 viewport
      const scaleByW = w / MAP_W
      const scaleByH = h / MAP_H
      setFitScale(Math.max(scaleByW, scaleByH))
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
            {Array.from({ length: 15 * 15 }, (_, i) => (
              <div key={i} className="pixel-map-tile tile-grass" />
            ))}

            {buildings.map((b) => (
              <Building key={b.id} {...b} active={b.id === activeBuilding} onClick={handleBuildingClick} />
            ))}

            {cats.map((cat) => (
              <CatSprite key={cat.id} cat={cat} onClick={onCatClick} />
            ))}

            {TOWN_AGENTS.map((agent) => {
              const bubble = getBubble(agent.name)
              return (
                <AgentSprite
                  key={agent.id}
                  agent={agent}
                  autoWalk
                  dialogBubble={bubble?.content}
                  dialogEmotion={bubble?.emotion}
                  onClick={() => setLetterAgent(agent)}
                />
              )
            })}

            <AgentSprite agent={playerAgent} autoWalk={false} />
          </div>
        </div>
      </div>

      {letterAgent ? <LetterDialog agent={letterAgent} onClose={() => setLetterAgent(null)} /> : null}
    </div>
  )
})
