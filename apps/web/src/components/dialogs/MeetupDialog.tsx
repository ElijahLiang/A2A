import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGame } from '../../contexts/GameContext'
import { useToken } from '../../contexts/TokenContext'
import { TOKEN_REASONS } from '../../types'
import './MeetupDialog.css'

type Step = 1 | 2 | 3

export function MeetupDialog() {
  const { user } = useAuth()
  const { meetupSession, endMeetup, addStamp, addFriend, checkUnlocks } = useGame()
  const { earn } = useToken()

  const [step, setStep] = useState<Step>(1)
  const [countdown, setCountdown] = useState(15 * 60)
  const [handshakeDone, setHandshakeDone] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [photoCountdown, setPhotoCountdown] = useState<number | null>(null)
  const [photoFlash, setPhotoFlash] = useState(false)
  const [friendChecked, setFriendChecked] = useState(false)
  const photoSeqRef = useRef(0)

  const ownerId = user?.id ?? localStorage.getItem('a2a-publisher-id') ?? 'local'

  useEffect(() => {
    if (!meetupSession) return
    setStep(1)
    setCountdown(15 * 60)
    setHandshakeDone(false)
    setPhotoTaken(false)
    setPhotoCountdown(null)
    setPhotoFlash(false)
    setFriendChecked(false)
  }, [meetupSession])

  useEffect(() => {
    if (!meetupSession || step !== 1) return
    const t = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [meetupSession, step])

  useEffect(() => {
    if (step !== 3 || !meetupSession) return
    let cancelled = false
    const t = window.setTimeout(() => {
      if (cancelled) return
      setHandshakeDone(true)
      earn(1, TOKEN_REASONS.MEETUP_SUCCESS, meetupSession.activityId)
      addStamp({
        ownerId,
        venueId: meetupSession.venueId,
        activityType: meetupSession.activityType,
        partnerId: meetupSession.partnerId,
        grade: 'silver',
        meetupId: `meetup-${meetupSession.letterId}`,
        isSeasonal: false,
      })
      checkUnlocks()
    }, 1200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [step, meetupSession, earn, addStamp, ownerId, checkUnlocks])

  useEffect(() => {
    if (photoCountdown === null || photoCountdown <= 0) return
    const t = window.setTimeout(() => {
      setPhotoCountdown((c) => (c === null ? null : c - 1))
    }, 650)
    return () => clearTimeout(t)
  }, [photoCountdown])

  useLayoutEffect(() => {
    if (photoCountdown !== 0) return
    setPhotoFlash(true)
    setPhotoCountdown(null)
  }, [photoCountdown])

  useEffect(() => {
    if (!photoFlash) return
    const seq = photoSeqRef.current
    const t = window.setTimeout(() => {
      setPhotoFlash(false)
      setPhotoTaken(true)
      if (photoSeqRef.current !== seq) return
      if (meetupSession) earn(2, TOKEN_REASONS.PHOTO_TAKEN, meetupSession.activityId)
    }, 420)
    return () => clearTimeout(t)
  }, [photoFlash, meetupSession, earn])

  const timeLabel = useMemo(() => {
    const m = String(Math.floor(countdown / 60)).padStart(2, '0')
    const s = String(countdown % 60).padStart(2, '0')
    return `${m}:${s}`
  }, [countdown])

  const startPhotoCountdown = () => {
    if (photoTaken || !meetupSession || photoCountdown !== null || photoFlash) return
    photoSeqRef.current += 1
    setPhotoCountdown(3)
  }

  const finish = () => {
    if (friendChecked && meetupSession) {
      addFriend({
        userId: ownerId,
        friendId: meetupSession.partnerId,
        source: 'meetup',
      })
    }
    endMeetup()
  }

  if (!meetupSession) return null

  return (
    <div className="meetup-overlay" role="dialog" aria-label="会面">
      <div className="meetup-panel pixel-card">
        <div className="meetup-steps" aria-label="当前步骤">
          <div className={`meetup-step-node ${step >= 1 ? 'is-active' : ''}`}>
            <div className="meetup-step-num">1</div>
            <div className="meetup-step-label">等待</div>
          </div>
          <div className={`meetup-step-line ${step > 1 ? 'is-done' : ''}`} />
          <div className={`meetup-step-node ${step >= 2 ? 'is-active' : ''}`}>
            <div className="meetup-step-num">{step > 2 ? '✓' : '2'}</div>
            <div className="meetup-step-label">验证</div>
          </div>
          <div className={`meetup-step-line ${step > 2 ? 'is-done' : ''}`} />
          <div className={`meetup-step-node ${step >= 3 ? 'is-active' : ''}`}>
            <div className="meetup-step-num">3</div>
            <div className="meetup-step-label">结算</div>
          </div>
        </div>

        {step === 1 ? (
          <>
            <div className="meetup-title">等待会面</div>
            <p className="meetup-location">{meetupSession.location}</p>
            <div className="meetup-countdown">
              <span className="meetup-countdown-label">剩余</span>
              <span className="meetup-countdown-digits">{timeLabel}</span>
            </div>
            <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small meetup-qr">
              出示二维码
            </button>
            <button type="button" className="pixel-btn pixel-btn-primary" onClick={() => setStep(2)}>
              我已到达
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="meetup-title">验证中</div>
            <p className="meetup-sub">扫码或 GPS 验证（MVP 用按钮模拟）</p>
            <div className="meetup-fake-scan" aria-hidden />
            <button type="button" className="pixel-btn pixel-btn-primary" onClick={() => setStep(3)}>
              模拟验证成功
            </button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            {!handshakeDone ? (
              <div className="meetup-handshake">
                <div className="meetup-handshake-stars" aria-hidden />
                <div className="meetup-handshake-actors">
                  <div className="meetup-mini meetup-mini--a" />
                  <div className="meetup-mini meetup-mini--b" />
                </div>
                <p className="meetup-handshake-caption">握手确认中…</p>
              </div>
            ) : (
              <div className="meetup-settle">
                {(photoCountdown !== null && photoCountdown > 0) || photoFlash ? (
                  <div className="meetup-photo-stage" aria-live="polite">
                    {photoFlash ? <div className="meetup-photo-flash" /> : null}
                    {photoCountdown !== null && photoCountdown > 0 && !photoFlash ? (
                      <span className="meetup-photo-count">{photoCountdown}</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="meetup-stamp-card" aria-hidden>
                  <div className="meetup-stamp-inner">A2A</div>
                  <div className="meetup-stamp-sub">会面邮戳</div>
                </div>
                <p className="meetup-token-msg">代币 +1（会面成功）</p>
                <div className="meetup-actions">
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-secondary pixel-btn-small"
                    onClick={startPhotoCountdown}
                    disabled={photoTaken || photoCountdown !== null || photoFlash}
                  >
                    {photoTaken ? '已合影 +2' : photoCountdown !== null || photoFlash ? '拍摄中…' : '拍摄合影 (+2)'}
                  </button>
                </div>
                <label className="meetup-friend-row">
                  <input
                    type="checkbox"
                    checked={friendChecked}
                    onChange={(e) => setFriendChecked(e.target.checked)}
                  />
                  <span>加为好友</span>
                </label>
                <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small meetup-skip-photo" onClick={finish}>
                  跳过合影，直接结算
                </button>
                <button type="button" className="pixel-btn pixel-btn-primary" onClick={finish}>
                  回到小镇
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
