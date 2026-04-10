import { type ReactNode, useEffect } from 'react'

type MapDialogProps = {
  title: string
  icon: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** 发布意图等：底部半屏 slide-up（ui-interaction-spec） */
  layout?: 'center' | 'bottom-sheet'
}

export function MapDialog({ title, icon, subtitle, onClose, children, layout = 'center' }: MapDialogProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const overlayClass =
    layout === 'bottom-sheet' ? 'map-dialog-overlay map-dialog-overlay--bottom-sheet' : 'map-dialog-overlay'
  const panelClass = layout === 'bottom-sheet' ? 'map-dialog map-dialog--bottom-sheet' : 'map-dialog'

  return (
    <div className={overlayClass} onClick={onClose}>
      <section className={panelClass} onClick={(event) => event.stopPropagation()}>
        <header className="map-dialog-header">
          <div>
            <div className="map-dialog-title">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            {subtitle ? <div className="map-dialog-subtitle">{subtitle}</div> : null}
          </div>
          <button type="button" className="map-dialog-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>
        <div className="map-dialog-body">{children}</div>
      </section>
    </div>
  )
}
