import { Link, useSearchParams } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { FURNITURE_CATALOG } from '../data/furniture'
import './PixelHome.css'

export function PixelHome() {
  const { home } = useGame()
  const [search] = useSearchParams()
  const visitId = search.get('visit')

  return (
    <div className="sub-page pixel-home-page">
      <header className="sub-page-header">
        <Link to="/town" className="pixel-btn pixel-btn-secondary pixel-btn-small">
          ← 地图
        </Link>
        <h1 className="sub-page-title">{visitId ? '好友小屋' : '像素小屋'}</h1>
      </header>

      <main className="sub-page-main">
        {visitId ? (
          <p className="pixel-home-visit-banner pixel-card" role="status">
            串门模式：正在浏览 <strong>{visitId}</strong> 的公开陈设（演示 · 数据仍来自你的存档）
          </p>
        ) : null}
        <div className="pixel-home-stats pixel-card">
          <div className="pixel-home-stat">
            <span className="pixel-home-stat-label">等级</span>
            <span className="pixel-home-stat-value">{home.level}</span>
          </div>
          <div className="pixel-home-stat">
            <span className="pixel-home-stat-label">串门访客</span>
            <span className="pixel-home-stat-value">{home.visitors}</span>
          </div>
          <div className="pixel-home-stat">
            <span className="pixel-home-stat-label">已解锁家具</span>
            <span className="pixel-home-stat-value">{home.furniture.length}</span>
          </div>
        </div>

        <h2 className="pixel-home-section-title">家具陈列</h2>
        <ul className="pixel-home-grid">
          {FURNITURE_CATALOG.map((item) => {
            const unlocked = home.furniture.includes(item.id)
            return (
              <li key={item.id} className={`pixel-home-item ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
                <div className="pixel-home-item-sprite" aria-hidden>
                  {unlocked ? (
                    <img src={item.sprite} alt="" className="pixel-home-item-img" width={48} height={48} draggable={false} />
                  ) : (
                    <span className="pixel-home-item-locked-glyph">?</span>
                  )}
                </div>
                <div className="pixel-home-item-name">{item.name}</div>
                <p className="pixel-home-item-desc">{unlocked ? item.effect ?? '已入驻小屋' : item.unlockCondition}</p>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
