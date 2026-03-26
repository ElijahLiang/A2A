import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { inferPersonaFromBio, type PersonaInference } from '../utils/inferPersonaFromBio'
import './PersonaQuiz.css'

export function PersonaQuiz({ onComplete }: { onComplete: (agentName: string) => void }) {
  const navigate = useNavigate()
  const { updateBio } = useAuth()
  const [bio, setBio] = useState('')
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<PersonaInference | null>(null)
  const [revealPhase, setRevealPhase] = useState(0)

  const liveInference = useMemo(() => inferPersonaFromBio(bio), [bio])

  const handleSubmit = () => {
    const trimmed = bio.trim()
    if (!trimmed || flipping) return
    const inf = inferPersonaFromBio(trimmed)
    setFlipping(true)
    updateBio(trimmed)
    setTimeout(() => {
      setResult(inf)
      setTimeout(() => setRevealPhase(1), 500)
      setTimeout(() => setRevealPhase(2), 1500)
      setTimeout(() => setRevealPhase(3), 2500)
    }, 600)
  }

  const handleEnterTown = () => {
    if (result) onComplete(result.agentName)
    navigate('/town')
  }

  if (result) {
    return (
      <div className="quiz-screen">
        <div className="quiz-dm quiz-dm--reveal" role="region" aria-label="邮差猫">
          <div className="quiz-dm-mascot" aria-hidden>
            🐱
          </div>
          <div className="quiz-dm-bubble quiz-dm-bubble--static">
            <p className="quiz-dm-text">邮差猫：拆信完毕！这就是我读到的你喵～</p>
          </div>
        </div>

        <div className="quiz-reveal">
          {revealPhase >= 1 && (
            <div className="reveal-envelope animate-envelope">
              <div className="reveal-seal">A2A</div>
            </div>
          )}
          {revealPhase >= 2 && (
            <div className="reveal-result animate-result">
              <div className="reveal-mbti-tag">{result.mbti}</div>
              <div className="reveal-bio-line">「{bio.trim()}」</div>
              <div className="reveal-name">
                你的分身：{result.agentName}
              </div>
              <p className="reveal-agent-desc">{result.agentDesc}</p>
              <p className="reveal-desc">{result.summary}</p>
              {result.traits.length > 0 && (
                <div className="reveal-traits" aria-label="推断标签">
                  {result.traits.map((t) => (
                    <span key={t} className="reveal-trait-pill">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {revealPhase >= 3 && (
            <button className="reveal-enter" onClick={handleEnterTown}>
              进入 A2A 小镇
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-screen quiz-screen--with-dm">
      <div className="quiz-persona-layout">
        <div className="quiz-dm">
          <div className="quiz-dm-mascot" aria-hidden>
            🐱
          </div>
          <div className="quiz-dm-bubble">
            <p className="quiz-dm-label">邮差猫 DM</p>
            <p className="quiz-dm-text">{liveInference.catHint}</p>
          </div>
        </div>

        <div className={`quiz-card ${flipping ? 'quiz-card-flip' : ''}`}>
          <div className="quiz-card-inner quiz-card-inner--bio">
            <div className="quiz-question-num">PROFILE</div>
            <label className="quiz-bio-label" htmlFor="persona-bio">
              用一句话形容一下自己
            </label>
            <textarea
              id="persona-bio"
              className="quiz-textarea"
              rows={4}
              maxLength={120}
              placeholder="例如：喜欢安静写代码，偶尔也会想找人喝一杯。"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={flipping}
            />
            <p className="quiz-bio-hint">{bio.length}/120</p>
            {bio.trim().length >= 6 && (
              <p className="quiz-live-preview" aria-live="polite">
                初步推断：<span className="quiz-live-mbti">{liveInference.mbti}</span> · 分身倾向{' '}
                <strong>{liveInference.agentName}</strong>
              </p>
            )}
            <button
              type="button"
              className="quiz-submit-bio"
              onClick={handleSubmit}
              disabled={!bio.trim() || flipping}
            >
              确认并继续
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
