import './MapToolbar.css'

type MapToolbarProps = {
  onLogout: () => void
}

export function MapToolbar({ onLogout }: MapToolbarProps) {
  const now = new Date()
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const periodLabel =
    now.getHours() < 12 ? '上午巡视' : now.getHours() < 18 ? '午后社交' : '夜间邀约'

  return (
    <footer className="map-toolbar">
      <div className="map-toolbar-group">
        <span className="map-toolbar-logo">A2A Town</span>
        <span className="map-toolbar-chip">{periodLabel}</span>
      </div>
      <div className="map-toolbar-group map-toolbar-center">
        <span className="map-toolbar-status">
          <span className="map-toolbar-dot" />
          Agent 状态正常 · 点击建筑在框内完成操作
        </span>
      </div>
      <div className="map-toolbar-group">
        <span className="map-toolbar-time">{timeLabel}</span>
        <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small map-toolbar-btn" onClick={onLogout}>
          离开小镇
        </button>
      </div>
    </footer>
  )
}
