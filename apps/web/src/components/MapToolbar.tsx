import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TokenDisplay } from './TokenDisplay'
import './MapToolbar.css'

type MapToolbarProps = {
  onLogout: () => void
  onSeason?: () => void
}

const CLOCK_TICK_MS = 20000

function formatClock(d: Date): { time: string; period: string } {
  const h = d.getHours()
  const time = `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const period = h < 12 ? '上午巡视' : h < 18 ? '午后社交' : '夜间邀约'
  return { time, period }
}

export const MapToolbar = memo(function MapToolbar({ onLogout, onSeason }: MapToolbarProps) {
  const [{ time, period }, setClock] = useState(() => formatClock(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock(new Date())), CLOCK_TICK_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="map-toolbar">
      <div className="map-toolbar-group">
        <span className="map-toolbar-logo">A2A Town</span>
        <span className="map-toolbar-chip">{period}</span>
      </div>
      <div className="map-toolbar-group map-toolbar-center">
        <span className="map-toolbar-status">
          <span className="map-toolbar-dot" />
          Agent 状态正常 · 点击建筑在框内完成操作
        </span>
      </div>
      <div className="map-toolbar-group map-toolbar-actions">
        <TokenDisplay />
        {onSeason ? (
          <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small map-toolbar-btn" onClick={onSeason}>
            赛季
          </button>
        ) : null}
        <Link to="/stamp-book" className="pixel-btn pixel-btn-secondary pixel-btn-small map-toolbar-link">
          集邮
        </Link>
        <Link to="/pixel-home" className="pixel-btn pixel-btn-secondary pixel-btn-small map-toolbar-link">
          小屋
        </Link>
        <span className="map-toolbar-time">{time}</span>
        <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small map-toolbar-btn" onClick={onLogout}>
          离开小镇
        </button>
      </div>
    </footer>
  )
})
