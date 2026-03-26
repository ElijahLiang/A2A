import { useEffect, useRef, useState } from 'react'
import { useMail } from '../contexts/MailContext'
import type { Letter } from '../types'
import { AgentProxyDialog } from './dialogs/AgentProxyDialog'
import './MailLetter.css'

function formatWhen(t: number): string {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const TEAR_THRESHOLD = 80

type MailLetterProps = {
  letter: Letter
  onBack: () => void
}

export function MailLetter({ letter, onBack }: MailLetterProps) {
  const { markRead, sendReply, archiveLetter, confirmMeetup, declineMeetup } = useMail()
  const [sealed, setSealed] = useState(true)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [agentOpen, setAgentOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragX, setDragX] = useState(0)
  const startY = useRef(0)
  const dragYRef = useRef(0)
  const swipeStartX = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const progress = Math.min(1, dragY / TEAR_THRESHOLD)
  const paperPeek = dragY > 40 ? Math.min(1, (dragY - 40) / 40) : 0

  useEffect(() => {
    if (!sealed && letter.status === 'unread') {
      markRead(letter.id)
    }
  }, [sealed, letter.id, letter.status, markRead])

  const handlePointerDownTear = (e: React.PointerEvent) => {
    if (!sealed) return
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMoveTear = (e: React.PointerEvent) => {
    if (!sealed) return
    const dy = Math.max(0, startY.current - e.clientY)
    const capped = Math.min(120, dy)
    dragYRef.current = capped
    setDragY(capped)
  }

  const handlePointerUpTear = (e: React.PointerEvent) => {
    if (sealed) {
      if (dragYRef.current >= TEAR_THRESHOLD) {
        setSealed(false)
      }
      setDragY(0)
      dragYRef.current = 0
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const handleSwipeDown = (e: React.PointerEvent) => {
    swipeStartX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleSwipeMove = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return
    setDragX(e.clientX - swipeStartX.current)
  }

  const handleSwipeUp = (e: React.PointerEvent) => {
    const w = rootRef.current?.offsetWidth ?? 320
    if (swipeStartX.current !== null && dragX < -w * 0.5) {
      archiveLetter(letter.id)
      onBack()
    }
    swipeStartX.current = null
    setDragX(0)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const handleReply = async () => {
    const t = replyText.trim()
    if (t.length < 4) return
    await sendReply(letter.id, t)
    setReplyText('')
    setReplyOpen(false)
  }

  const mood = letter.mood ?? '#51b7a9'
  const w = rootRef.current?.offsetWidth ?? 320
  const swipeRatio = Math.min(1, Math.abs(dragX) / w)
  const tilt = dragX < 0 ? swipeRatio * -8 : 0
  const fade = dragX < 0 ? 1 - swipeRatio * 0.35 : 1

  return (
    <div
      ref={rootRef}
      className="mail-letter"
      style={{
        transform: dragX !== 0 ? `translateX(${dragX}px) rotate(${tilt}deg)` : undefined,
        opacity: fade,
        transition: dragX === 0 ? 'transform 0.2s steps(2, end), opacity 0.2s steps(2, end)' : undefined,
      }}
    >
      <AgentProxyDialog open={agentOpen} onClose={() => setAgentOpen(false)} peerLabel={letter.fromUserId} />
      <div className="mail-letter-top">
        <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={onBack}>
          ← 返回
        </button>
      </div>

      {sealed ? (
        <div
          className="mail-letter-container"
          onPointerDown={handlePointerDownTear}
          onPointerMove={handlePointerMoveTear}
          onPointerUp={handlePointerUpTear}
          onPointerCancel={handlePointerUpTear}
        >
          <p className="mail-letter-envelope-hint">向上拖撕开封口</p>
          <div
            className="mail-letter-envelope-3d"
            style={
              {
                '--drag-progress': progress,
                '--paper-peek': paperPeek,
              } as React.CSSProperties
            }
          >
            <div className="mail-letter-paper-peek" aria-hidden>
              <span className="mail-letter-peek-line">To: 你</span>
              <span className="mail-letter-peek-line">From: {letter.fromUserId}</span>
            </div>
            <div className="mail-envelope-stack">
              <svg className="mail-letter-svg-body" viewBox="0 0 200 120" role="img" aria-hidden>
                <rect
                  x="12"
                  y="8"
                  width="176"
                  height="104"
                  fill="var(--px-envelope)"
                  stroke="var(--px-envelope-border)"
                  strokeWidth="4"
                />
              </svg>
              <div className="mail-envelope-flap" />
              <div className="mail-envelope-stamp-mini" aria-hidden>
                A2A
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="mail-letter-paper"
          onPointerDown={handleSwipeDown}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeUp}
          onPointerCancel={handleSwipeUp}
        >
          <div className="mail-letter-row">
            <div className="mail-letter-avatar" aria-hidden>
              {letter.fromUserId.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="mail-letter-meta">来自 {letter.fromUserId}</div>
              <div className="mail-letter-place">线下见面前由 Agent 协助沟通</div>
            </div>
          </div>

          <div
            className="mail-letter-content-wrap"
            style={{
              borderLeftColor: mood,
              background: `color-mix(in srgb, ${mood} 20%, var(--px-paper-0))`,
            }}
          >
            <p className="mail-letter-content">{letter.content}</p>
          </div>

          <div className="mail-letter-when">📅 {formatWhen(letter.createdAt)} · 📍 见活动详情</div>

          {letter.round >= 3 ? (
            <div className="mail-letter-round3">
              <p className="mail-letter-round3-title">第 3 轮 · 请确认约定</p>
              <div className="mail-letter-round3-actions">
                <button
                  type="button"
                  className="pixel-btn pixel-btn-primary pixel-btn-small"
                  onClick={() => confirmMeetup(letter.id)}
                >
                  确认约定
                </button>
                <button
                  type="button"
                  className="pixel-btn pixel-btn-danger pixel-btn-small"
                  onClick={() => {
                    declineMeetup(letter.id)
                    onBack()
                  }}
                >
                  婉拒
                </button>
              </div>
            </div>
          ) : null}

          <div className="mail-letter-actions">
            <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={() => setReplyOpen((v) => !v)}>
              回信
            </button>
            <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => setAgentOpen(true)}>
              私聊
            </button>
          </div>

          {replyOpen ? (
            <div className="mail-letter-reply">
              <textarea
                className="pixel-textarea"
                placeholder="写回信"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
              <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={handleReply}>
                发送
              </button>
            </div>
          ) : null}

          <p className="mail-letter-swipe-hint">左滑过半屏可归档</p>
        </div>
      )}
    </div>
  )
}
