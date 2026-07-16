import { useEffect, useRef, useState } from 'react'
import { getHumanFlipX, getHumanFrame, HUMAN_SPRITES, type HumanSpriteType } from '../data/humanSprites'
import { WALK_FRAME_MS } from '../lib/world'
import './SpriteCharacter.css'

export type Direction = 'down' | 'up' | 'left' | 'right'
export type AnimState = 'idle' | 'walk'

interface SpriteCharacterProps {
  x: number
  y: number
  direction: Direction
  animState: AnimState
  /** 由 town store 驱动时传入，与位移同 tick */
  frameIndex?: number
  spriteType?: HumanSpriteType
  label?: string
  statusText?: string
  dialogBubble?: string
  dialogEmotion?: string
  onClick?: () => void
}

export function SpriteCharacter({
  x,
  y,
  direction,
  animState,
  frameIndex: externalFrameIndex,
  spriteType,
  label,
  statusText,
  dialogBubble,
  dialogEmotion,
  onClick,
}: SpriteCharacterProps) {
  const [internalFrameIndex, setInternalFrameIndex] = useState(0)
  const [idleOverride, setIdleOverride] = useState<string | null>(null)
  const drivenExternally = externalFrameIndex !== undefined

  const lockedDirectionRef = useRef(direction)
  const prevAnimStateRef = useRef(animState)
  if (animState === 'idle') {
    lockedDirectionRef.current = direction
  } else if (animState === 'walk' && prevAnimStateRef.current === 'idle') {
    lockedDirectionRef.current = direction
  } else if (animState === 'walk' && direction !== lockedDirectionRef.current) {
    lockedDirectionRef.current = direction
  }
  prevAnimStateRef.current = animState
  const stableDirection = lockedDirectionRef.current

  const frameIndex = drivenExternally ? externalFrameIndex : internalFrameIndex

  useEffect(() => {
    if (drivenExternally || animState !== 'walk') {
      if (!drivenExternally) setInternalFrameIndex(0)
      return
    }
    const interval = setInterval(() => {
      setInternalFrameIndex((prev) => prev + 1)
    }, WALK_FRAME_MS)
    return () => clearInterval(interval)
  }, [animState, drivenExternally])

  useEffect(() => {
    if (!spriteType || animState !== 'idle') {
      setIdleOverride(null)
      return
    }
    const specialPool = HUMAN_SPRITES[spriteType].special
    setIdleOverride(null)
    const interval = setInterval(
      () => {
        if (Math.random() > 0.58) {
          setIdleOverride(null)
          return
        }
        const frame = specialPool[Math.floor(Math.random() * specialPool.length)]
        setIdleOverride(frame)
      },
      2200 + Math.floor(Math.random() * 1800),
    )
    return () => clearInterval(interval)
  }, [animState, spriteType])

  const flipX = spriteType ? getHumanFlipX(spriteType, stableDirection) : false
  const humanFrame = spriteType
    ? getHumanFrame(spriteType, stableDirection, animState, frameIndex, idleOverride)
    : null

  return (
    <div
      className={`sprite-character ${onClick ? 'sprite-clickable' : ''}`}
      style={{
        left: x,
        top: y,
        transform: flipX ? 'scaleX(-1)' : undefined,
        zIndex: 20 + Math.round(y / 16),
      }}
      onClick={onClick}
    >
      <div className="sprite-layers">
        {humanFrame ? (
          <img className="sprite-human-frame" src={humanFrame} alt="" aria-hidden />
        ) : (
          <div className="sprite-placeholder" aria-hidden />
        )}
      </div>
      {dialogBubble && (
        <div
          className={`sprite-dialog-bubble ${dialogEmotion === 'positive' ? 'bubble-emotion-positive' : dialogEmotion === 'negative' ? 'bubble-emotion-negative' : ''}`}
          style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
        >
          {dialogBubble}
        </div>
      )}
      {(label || statusText) && (
        <div className="sprite-info" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
          {label && <div className="sprite-label">{label}</div>}
          {statusText && !dialogBubble && <div className="sprite-status">{statusText}</div>}
        </div>
      )}
    </div>
  )
}
