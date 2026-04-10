import { memo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMail } from '../contexts/MailContext'
import { useToken } from '../contexts/TokenContext'
import { FriendList } from './FriendList'
import type { BuildingId } from './Building'
import './MapToolbar.css'

type MapToolbarProps = {
  activeBuilding: BuildingId | null
  onOpenBuilding: (id: BuildingId) => void
  onCloseBuilding: () => void
  onLogout: () => void
  onSeason?: () => void
}

const CLOCK_TICK_MS = 20_000

function getPeriod(d: Date): string {
  const h = d.getHours()
  return h < 12 ? '上午' : h < 18 ? '午后' : '夜间'
}

function getTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type TabId = 'map' | 'mail' | 'square' | 'friends' | 'me'

/** 来自 `assets/figma`，复制到 `public/ui` */
const TABS: { id: TabId; iconSrc: string; label: string }[] = [
  { id: 'map',     iconSrc: '/ui/toolbar-map.svg',    label: '小镇' },
  { id: 'mail',    iconSrc: '/ui/toolbar-mail.svg',   label: '信箱' },
  { id: 'square',  iconSrc: '/ui/icon-star.svg',      label: '广场' },
  { id: 'friends', iconSrc: '/ui/icon-user.svg',      label: '好友' },
  { id: 'me',      iconSrc: '/ui/toolbar-profile.svg', label: '我的' },
]

export const MapToolbar = memo(function MapToolbar({
  activeBuilding,
  onOpenBuilding,
  onCloseBuilding,
  onLogout,
  onSeason,
}: MapToolbarProps) {
  const { unreadCount } = useMail()
  const { balance } = useToken()
  const [period, setPeriod] = useState(() => getPeriod(new Date()))
  const [time, setTime]     = useState(() => getTime(new Date()))
  const [friendOpen, setFriendOpen] = useState(false)
  const [meOpen, setMeOpen] = useState(false)
  const meRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date()
      setPeriod(getPeriod(now))
      setTime(getTime(now))
    }, CLOCK_TICK_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!meOpen) return
    const handler = (e: MouseEvent) => {
      if (meRef.current && !meRef.current.contains(e.target as Node)) {
        setMeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [meOpen])

  const activeTab: TabId | null =
    friendOpen                           ? 'friends' :
    meOpen                               ? 'me'      :
    activeBuilding === 'post_office'     ? 'mail'    :
    activeBuilding === 'town_square'     ? 'square'  :
    activeBuilding                       ? null      : 'map'

  const handleTab = (id: TabId) => {
    setMeOpen(false)
    setFriendOpen(false)
    switch (id) {
      case 'map':     onCloseBuilding(); break
      case 'mail':    onOpenBuilding('post_office'); break
      case 'square':  onOpenBuilding('town_square'); break
      case 'friends': setFriendOpen(true); break
      case 'me':      setMeOpen(v => !v); break
    }
  }

  return (
    <>
      <FriendList open={friendOpen} onClose={() => setFriendOpen(false)} />

      {/* "我的" 弹出菜单 */}
      {meOpen && (
        <div className="navbar-me-menu" ref={meRef}>
          <button className="navbar-me-item" onClick={() => { setMeOpen(false); onOpenBuilding('home') }}>
            <span aria-hidden>👤</span>我的档案
          </button>
          {onSeason && (
            <button className="navbar-me-item" onClick={() => { setMeOpen(false); onSeason() }}>
              <span aria-hidden>🌸</span>当前赛季
            </button>
          )}
          <Link className="navbar-me-item" to="/stamp-book" onClick={() => setMeOpen(false)}>
            <span aria-hidden>📬</span>集邮册
          </Link>
          <Link className="navbar-me-item" to="/pixel-home" onClick={() => setMeOpen(false)}>
            <span aria-hidden>🏡</span>像素小屋
          </Link>
          <div className="navbar-me-divider" />
          <button className="navbar-me-item navbar-me-item--danger" onClick={onLogout}>
            <span aria-hidden>🚪</span>离开小镇
          </button>
        </div>
      )}

      {/* ── 底部导航栏 ── */}
      <footer className="map-toolbar">
        {/* 极细 HUD 状态条 */}
        <div className="navbar-hud">
          <span className="navbar-hud-dot" aria-hidden />
          <span className="navbar-hud-text">Avatar 活跃 · {period}</span>
          <span className="navbar-hud-spacer" />
          <span className="navbar-hud-token" title="小镇代币">
            <img src="/ui/decor-coin-1.svg" alt="" className="navbar-hud-token-icon" width={10} height={10} draggable={false} />
            {balance}
          </span>
          <span className="navbar-hud-time">{time}</span>
        </div>

        {/* Tab 栏 */}
        <nav className="navbar-tabs" aria-label="主导航">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`navbar-tab${activeTab === tab.id ? ' navbar-tab--active' : ''}`}
              onClick={() => handleTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="navbar-tab-icon-wrap" aria-hidden>
                <img
                  className="navbar-tab-icon"
                  src={tab.iconSrc}
                  alt=""
                  draggable={false}
                />
                {tab.id === 'mail' && unreadCount > 0 && (
                  <span className="navbar-tab-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="navbar-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </footer>
    </>
  )
})
