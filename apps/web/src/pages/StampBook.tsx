import { Link } from 'react-router-dom'
import { SeasonPanel } from '../components/SeasonPanel'
import { useGame } from '../contexts/GameContext'
import { STAMP_GRADE_LABEL, VENUE_LABEL } from '../data/stamps'
import './StampBook.css'

export function StampBook() {
  const { stamps } = useGame()

  return (
    <div className="sub-page stamp-book-page">
      <header className="sub-page-header">
        <Link to="/town" className="pixel-btn pixel-btn-secondary pixel-btn-small">
          ← 地图
        </Link>
        <h1 className="sub-page-title">集邮册</h1>
      </header>

      <main className="sub-page-main">
        <SeasonPanel />

        {stamps.length === 0 ? (
          <p className="stamp-book-empty">暂无邮戳。完成线下会面并结算后即可收集。</p>
        ) : (
          <ul className="stamp-book-grid">
            {stamps.map((s) => (
              <li key={s.id} className="stamp-book-card">
                <div className={`stamp-book-grade stamp-book-grade--${s.grade}`}>{STAMP_GRADE_LABEL[s.grade]}</div>
                <div className="stamp-book-venue">{VENUE_LABEL[s.venueId] ?? s.venueId}</div>
                <div className="stamp-book-type">{s.activityType}</div>
                <div className="stamp-book-partner">与 {s.partnerId}</div>
                <time className="stamp-book-time">{new Date(s.earnedAt).toLocaleString()}</time>
                {s.isSeasonal ? <span className="stamp-book-tag">赛季</span> : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
