import { useGame } from '../../contexts/GameContext'
import { STAMP_GRADE_LABEL, VENUE_LABEL } from '../../data/stamps'
import './StampUnlockDialog.css'

export function StampUnlockDialog() {
  const { stampUnlock, dismissStampUnlock } = useGame()

  if (!stampUnlock) return null

  return (
    <div className="stamp-unlock-overlay" role="dialog" aria-label="获得邮戳">
      <div className="stamp-unlock-panel pixel-card">
        <div className="stamp-unlock-title">新邮戳</div>
        <div className={`stamp-unlock-seal stamp-unlock-seal--${stampUnlock.grade}`}>
          <span className="stamp-unlock-seal-grade">{STAMP_GRADE_LABEL[stampUnlock.grade]}</span>
          <span className="stamp-unlock-seal-venue">{VENUE_LABEL[stampUnlock.venueId] ?? stampUnlock.venueId}</span>
        </div>
        <p className="stamp-unlock-desc">
          {stampUnlock.activityType} · 与 {stampUnlock.partnerId}
        </p>
        <button type="button" className="pixel-btn pixel-btn-primary" onClick={dismissStampUnlock}>
          收下
        </button>
      </div>
    </div>
  )
}
