import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToken } from '../../contexts/TokenContext'
import { publishActivity } from '../../services/activityApi'
import { TOKEN_REASONS, type TokenReason } from '../../types'
import './IntentDialog.css'

const TIME_OPTIONS = [
  { value: 'today-lunch', label: '今天中午' },
  { value: 'today-night', label: '今晚' },
  { value: 'tomorrow', label: '明天' },
  { value: 'weekend', label: '周末' },
]

type GroupKey = '2' | '3-5' | 'unlimited'

const GROUP_OPTIONS: { key: GroupKey; label: string; cost: number; reason: TokenReason }[] = [
  { key: '2', label: '2 人', cost: 1, reason: TOKEN_REASONS.PUBLISH_DUO },
  { key: '3-5', label: '3~5 人', cost: 2, reason: TOKEN_REASONS.PUBLISH_GROUP },
  { key: 'unlimited', label: '不限', cost: 3, reason: TOKEN_REASONS.PUBLISH_OPEN },
]

function hslToHex(hue: number, s = 72, l = 48): string {
  let h = hue / 360
  const sat = s / 100
  const light = l / 100
  let r: number
  let g: number
  let b: number
  if (sat === 0) {
    r = g = b = light
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
    const p = 2 * light - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const hex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

type IntentDialogProps = {
  venueId: string
  activityType: string
  activityLabel: string
  onDone: () => void
}

type Phase = 'form' | 'sending' | 'success'

export function IntentDialog({ venueId, activityType, activityLabel, onDone }: IntentDialogProps) {
  const { user } = useAuth()
  const { spend, canAfford } = useToken()

  const publisherId = useMemo(() => {
    if (user?.id) return user.id
    const k = 'a2a-publisher-id'
    let id = localStorage.getItem(k)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(k, id)
    }
    return id
  }, [user?.id])

  const [description, setDescription] = useState('')
  const [time, setTime] = useState('today-night')
  const [groupKey, setGroupKey] = useState<GroupKey>('2')
  const [moodHue, setMoodHue] = useState(168)
  const [phase, setPhase] = useState<Phase>('form')
  const [sendingStep, setSendingStep] = useState<1 | 2 | 3>(1)

  const moodHex = useMemo(() => hslToHex(moodHue), [moodHue])
  const group = GROUP_OPTIONS.find((g) => g.key === groupKey) ?? GROUP_OPTIONS[0]
  const cost = group.cost
  const affordable = canAfford(cost)
  const timeLabel = TIME_OPTIONS.find((t) => t.value === time)?.label ?? ''

  useEffect(() => {
    if (phase !== 'sending') return
    setSendingStep(1)
    const s2 = window.setTimeout(() => setSendingStep(2), 300)
    const s3 = window.setTimeout(() => setSendingStep(3), 600)
    const done = window.setTimeout(() => setPhase('success'), 1480)
    return () => {
      clearTimeout(s2)
      clearTimeout(s3)
      clearTimeout(done)
    }
  }, [phase])

  const handleSubmit = useCallback(() => {
    if (description.trim().length < 8 || !affordable) return
    const spent = spend(cost, group.reason)
    if (!spent) return

    const createdAt = Date.now()
    const expiresAt = createdAt + 48 * 60 * 60 * 1000

    void publishActivity({
      publisherId,
      venueId,
      activityType,
      description: description.trim(),
      time: timeLabel,
      location: activityLabel,
      groupSize: group.key,
      mood: moodHex,
      tokenCost: cost,
      status: 'recruiting',
      createdAt,
      expiresAt,
    })

    setPhase('sending')
  }, [
    activityLabel,
    activityType,
    affordable,
    cost,
    description,
    group.key,
    group.reason,
    moodHex,
    publisherId,
    spend,
    timeLabel,
    venueId,
  ])

  const longPressTimer = useRef(0)

  const clearLongPress = () => {
    window.clearTimeout(longPressTimer.current)
    longPressTimer.current = 0
  }

  const onStampPointerDown = () => {
    if (description.trim().length < 8 || !affordable || phase !== 'form') return
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = 0
      handleSubmit()
    }, 520)
  }

  const onStampPointerEnd = () => {
    clearLongPress()
  }

  const moodDrag = useRef<{ id: number; lastX: number } | null>(null)

  const onMoodPointerDown = (e: React.PointerEvent) => {
    moodDrag.current = { id: e.pointerId, lastX: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onMoodPointerMove = (e: React.PointerEvent) => {
    if (!moodDrag.current || moodDrag.current.id !== e.pointerId) return
    const dx = e.clientX - moodDrag.current.lastX
    moodDrag.current.lastX = e.clientX
    setMoodHue((h) => (h + Math.round(dx) + 360) % 360)
  }

  const onMoodPointerEnd = (e: React.PointerEvent) => {
    if (moodDrag.current?.id === e.pointerId) moodDrag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  if (phase === 'success') {
    return (
      <div className="dialog-stack">
        <div className="pixel-card">
          <div className="dialog-box-title">Avatar 已出发</div>
          <p>
            你的 `{activityType}` 意图已投递到 {activityLabel}。系统会先筛选共鸣对象，再把结果送到邮局。
          </p>
          <div className="pixel-progress">
            <div className="pixel-progress-fill" style={{ width: '62%' }} />
          </div>
        </div>
        <button type="button" className="pixel-btn pixel-btn-primary" onClick={onDone}>
          回到地图
        </button>
      </div>
    )
  }

  if (phase === 'sending') {
    return (
      <div className="dialog-stack intent-dialog-sending">
        <div
          className={`intent-send-overlay intent-send-overlay--stage-${sendingStep}`}
          aria-hidden
        >
          <div className="intent-send-dim" />
          <div className="intent-envelope-stage">
            <div className={`intent-envelope-bundle intent-envelope-bundle--step-${sendingStep}`}>
              <div className="intent-shockwave" aria-hidden />
              <div className="intent-envelope-svg-wrap">
                <svg className="intent-envelope-svg" viewBox="0 0 200 170" role="img" aria-label="信封">
                  <title>信封</title>
                  <rect
                    x="14"
                    y="56"
                    width="172"
                    height="104"
                    fill="var(--px-envelope)"
                    stroke="var(--px-envelope-border)"
                    strokeWidth="4"
                  />
                  <polygon
                    points="14,56 100,18 186,56"
                    fill="var(--px-envelope)"
                    stroke="var(--px-envelope-border)"
                    strokeWidth="4"
                  />
                </svg>
                <div className="intent-stamp">A2A</div>
              </div>
              <div className="intent-stars" aria-hidden>
                <span className="intent-star intent-star--a" />
                <span className="intent-star intent-star--b" />
                <span className="intent-star intent-star--c" />
                <span className="intent-star intent-star--d" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dialog-stack">
      <div>
        <label className="pixel-label">活动描述</label>
        <textarea
          className="pixel-textarea"
          placeholder={`例如：想在${activityLabel}找一个聊得来的人，一起轻松度过 2 小时。`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={160}
        />
      </div>

      <div>
        <label className="pixel-label">心情色（在色块上横向滑动或拖滑动条）</label>
        <div className="intent-mood-row">
          <div
            className="intent-mood-swatch intent-mood-ring"
            style={{ backgroundColor: moodHex }}
            title={moodHex}
            onPointerDown={onMoodPointerDown}
            onPointerMove={onMoodPointerMove}
            onPointerUp={onMoodPointerEnd}
            onPointerCancel={onMoodPointerEnd}
          />
          <input
            type="range"
            min={0}
            max={359}
            value={moodHue}
            onChange={(e) => setMoodHue(Number(e.target.value))}
            className="intent-mood-range"
            aria-label="心情色相"
          />
        </div>
      </div>

      <div>
        <label className="pixel-label">时间</label>
        <div className="choice-row">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`pixel-btn pixel-btn-small choice-btn ${
                time === option.value ? 'pixel-btn-primary' : 'pixel-btn-secondary'
              }`}
              onClick={() => setTime(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="pixel-label">人数</label>
        <div className="choice-row">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`pixel-btn pixel-btn-small choice-btn ${
                groupKey === option.key ? 'pixel-btn-primary' : 'pixel-btn-secondary'
              }`}
              onClick={() => setGroupKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className={`intent-cost-hint ${!affordable ? 'intent-cost-hint--warn' : ''}`}>
          发布将消耗 {cost} 枚代币
          {!affordable ? ' · 余额不足，无法派出' : ''}
        </p>
      </div>

      <div className="pixel-card">
        <div className="section-title">Agent Brief</div>
        <p style={{ margin: 0, lineHeight: 1.8 }}>
          Avatar 会优先找近期活跃、偏好 {activityLabel}、对话节奏相近的人，再根据时间与人数偏好过滤。
        </p>
      </div>

      <p className="intent-longpress-hint">长按约 0.5s 盖章派出（交互规范：长按确认发布）</p>
      <button
        type="button"
        className="pixel-btn pixel-btn-primary intent-stamp-btn"
        onPointerDown={onStampPointerDown}
        onPointerUp={onStampPointerEnd}
        onPointerLeave={onStampPointerEnd}
        onPointerCancel={onStampPointerEnd}
        disabled={description.trim().length < 8 || !affordable || phase === 'sending'}
      >
        盖章派出（−{cost}）
      </button>
    </div>
  )
}
