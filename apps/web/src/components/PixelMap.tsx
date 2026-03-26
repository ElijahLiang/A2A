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

const MAP_W = 1200
const MAP_H = 780
const GRID_COLS = 12
const GRID_ROWS = 10

type PixelMapProps = {
  buildings: BuildingConfig[]
  cats?: SquareCat[]
  activeBuilding: BuildingId | null
  onBuildingClick: (buildingId: BuildingId) => void
  onCatClick?: (cat: SquareCat) => void
}

export const PixelMap = memo(function PixelMap({
  buildings,
  cats = [],
  activeBuilding,
  onBuildingClick,
  onCatClick,
}: PixelMapProps) {
  const bubbles = useAgentEvents()
  const [letterAgent, setLetterAgent] = useState<TownAgent | null>(null)
  const [playerRow, setPlayerRow] = useState(PLAYER_AGENT.startRow)
  const [playerCol, setPlayerCol] = useState(PLAYER_AGENT.startCol)
  const [camera, setCamera] = useState({ tx: 0, ty: 0, scale: 1 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)

  const playerAgent = useMemo(
    () => ({ ...PLAYER_AGENT, startRow: playerRow, startCol: playerCol }),
    [playerRow, playerCol],
  )

  const handleBuildingClick = (id: BuildingId) => {
    const b = buildings.find((x) => x.id === id)
    if (b) {
      const h = b.height ?? 2
      const w = b.width ?? 2
      const rowC = Math.min(GRID_ROWS, Math.max(1, b.row + Math.floor(h / 2)))
      const colC = Math.min(GRID_COLS, Math.max(1, b.col + Math.floor(w / 2)))
      const cellW = MAP_W / GRID_COLS
      const cellH = MAP_H / GRID_ROWS
      const cx = (colC - 0.5) * cellW
      const cy = (rowC - 0.5) * cellH
      setCamera({ tx: MAP_W / 2 - cx, ty: MAP_H / 2 - cy, scale: 1.38 })
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
    if (activeBuilding === null) {
      setCamera({ tx: 0, ty: 0, scale: 1 })
    }
  }, [activeBuilding])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setFitScale(w / MAP_W)
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => ro.disconnect()
  }, [])

  const isZoomed = camera.scale > 1.01

  return (
    <div className={`pixel-map-shell ${isZoomed ? 'pixel-map-shell--zoomed' : ''}`}>
      <div className="pixel-map-sign">A2A 小镇</div>
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
