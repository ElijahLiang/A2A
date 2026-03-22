import { type ReactNode, useEffect } from 'react'

type MapDialogProps = {
  title: string
  icon: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

export function MapDialog({ title, icon, subtitle, onClose, children }: MapDialogProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="map-dialog-overlay" onClick={onClose}>
      <section className="map-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="map-dialog-header">
          <div>
            <div className="map-dialog-title">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            {subtitle ? <div className="map-dialog-subtitle">{subtitle}</div> : null}
          </div>
          <button type="button" className="map-dialog-close" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="map-dialog-body">{children}</div>
      </section>
    </div>
  )
}
