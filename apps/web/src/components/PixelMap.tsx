import { useState } from 'react'
import { Building, type BuildingId } from './Building'
import { AgentSprite } from './AgentSprite'
import { LetterDialog } from './LetterDialog'
import { TOWN_AGENTS, PLAYER_AGENT, type TownAgent } from '../data/agents'
import { useAgentEvents } from '../hooks/useAgentEvents'
import type { BuildingConfig } from '../pages/TownMap'
import './PixelMap.css'

type PixelMapProps = {
  buildings: BuildingConfig[]
  activeBuilding: BuildingId | null
  onBuildingClick: (buildingId: BuildingId) => void
}

export function PixelMap({ buildings, activeBuilding, onBuildingClick }: PixelMapProps) {
  const bubbles = useAgentEvents()
  const [letterAgent, setLetterAgent] = useState<TownAgent | null>(null)

  const getBubble = (name: string) => {
    const b = bubbles.find(b => b.agentName === name)
    return b ? { content: b.content, emotion: b.emotion } : null
  }

  return (
    <div className="pixel-map-shell">
      <div className="pixel-map-sign">A2A 小镇</div>
      <div className="pixel-map">
        {Array.from({ length: 15 * 15 }, (_, i) => (
          <div key={i} className="pixel-map-tile tile-grass" />
        ))}

        {buildings.map(b => (
          <Building key={b.id} {...b} active={b.id === activeBuilding} onClick={onBuildingClick} />
        ))}

        {TOWN_AGENTS.map(agent => {
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

        <AgentSprite agent={PLAYER_AGENT} autoWalk={false} />
      </div>

      {letterAgent && (
        <LetterDialog
          agent={letterAgent}
          onClose={() => setLetterAgent(null)}
        />
      )}
    </div>
  )
}
