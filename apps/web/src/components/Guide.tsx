import { useCallback, useState } from 'react'
import { GUIDE_STEPS } from '../data/guideSteps'
import './Guide.css'

const STORAGE_KEY = 'a2a-guide-dismissed'

export function Guide() {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(() => typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY))

  const dismiss = useCallback((value: 'done' | 'skip') => {
    localStorage.setItem(STORAGE_KEY, value)
    setOpen(false)
  }, [])

  const next = useCallback(() => {
    if (step >= GUIDE_STEPS.length - 1) {
      dismiss('done')
    } else {
      setStep((s) => s + 1)
    }
  }, [step, dismiss])

  if (!open) return null

  const current = GUIDE_STEPS[step]

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label="新手引导">
      <div className="guide-panel pixel-card">
        <div className="guide-mascot" aria-hidden>
          🐱
        </div>
        <div className="guide-main">
          <p className="guide-text">{current.body}</p>
          <div className="guide-actions">
            <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={next}>
              {step >= GUIDE_STEPS.length - 1 ? '开始探索！' : '下一步'}
            </button>
            <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => dismiss('skip')}>
              跳过教程
            </button>
            <div className="guide-dots" aria-hidden>
              {GUIDE_STEPS.map((s, i) => (
                <span key={s.id} className={`guide-dot ${i === step ? 'is-active' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
