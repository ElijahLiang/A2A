import { SpriteCharacter } from './SpriteCharacter'
import { useTownActor } from '../hooks/useTownActor'
import { TILE } from '../lib/world'
import type { TownAgent } from '../data/agents'

interface AgentSpriteProps {
  agent: TownAgent
  autoWalk?: boolean
  dialogBubble?: string
  dialogEmotion?: string
  onClick?: () => void
}

export function AgentSprite({ agent, autoWalk = true, dialogBubble, dialogEmotion, onClick }: AgentSpriteProps) {
  const actor = useTownActor(agent.id)

  if (!actor || actor.kind !== 'human') {
    return (
      <SpriteCharacter
        x={(agent.startCol - 1) * TILE}
        y={(agent.startRow - 1) * TILE}
        direction="down"
        animState="idle"
        frameIndex={0}
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
      x={actor.x}
      y={actor.y}
      direction={actor.direction}
      animState={autoWalk === false ? 'idle' : actor.animState}
      frameIndex={actor.frameIndex}
      spriteType={actor.spriteType}
      label={actor.label}
      statusText={actor.animState === 'walk' ? actor.status : undefined}
      dialogBubble={dialogBubble}
      dialogEmotion={dialogEmotion}
      onClick={onClick}
    />
  )
}
