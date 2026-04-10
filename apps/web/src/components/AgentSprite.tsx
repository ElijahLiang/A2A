import { SpriteCharacter } from './SpriteCharacter'
import { useAgentWalker } from '../hooks/useAgentWalker'
import type { TownAgent } from '../data/agents'

interface AgentSpriteProps {
  agent: TownAgent
  autoWalk?: boolean
  dialogBubble?: string
  dialogEmotion?: string
  onClick?: () => void
}

export function AgentSprite({ agent, autoWalk = true, dialogBubble, dialogEmotion, onClick }: AgentSpriteProps) {
  const walker = useAgentWalker(agent.startRow, agent.startCol)
  const TILE = 64

  if (!autoWalk) {
    return (
      <SpriteCharacter
        x={(agent.startCol - 1) * TILE}
        y={(agent.startRow - 1) * TILE}
        direction="down"
        animState="idle"
        layers={agent.layers}
        spriteType={agent.spriteType}
        label={agent.name}
        statusText={agent.status}
        dialogBubble={dialogBubble}
        dialogEmotion={dialogEmotion}
        onClick={onClick}
      />
    )
  }

  return (
    <SpriteCharacter
      x={walker.x}
      y={walker.y}
      direction={walker.direction}
      animState={walker.animState}
      layers={agent.layers}
      spriteType={agent.spriteType}
      label={agent.name}
      statusText={walker.animState === 'walk' ? agent.status : undefined}
      dialogBubble={dialogBubble}
      dialogEmotion={dialogEmotion}
      onClick={onClick}
    />
  )
}
