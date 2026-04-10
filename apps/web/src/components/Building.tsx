import './Building.css'

export type BuildingId =
  | 'library'
  | 'post_office'
  | 'restaurant'
  | 'town_square'
  | 'cafe'
  | 'gym'
  | 'cinema'
  | 'arcade'
  | 'home'

const BUILDING_IMAGES: Record<BuildingId, string> = {
  library: '/building-assets/library.png',
  post_office: '/building-assets/pond.png',
  restaurant: '/building-assets/restaurant.png',
  town_square: '/building-assets/square.png',
  cafe: '/building-assets/coffee-shop.png',
  gym: '/building-assets/gym.png',
  cinema: '/building-assets/gallery.png',
  arcade: '/building-assets/bookstore.png',
  home: '/building-assets/park.png',
}

const BUILDING_SIZES: Record<BuildingId, { width: number; height: number }> = {
  library: { width: 598, height: 635 },
  post_office: { width: 1303, height: 1055 },
  restaurant: { width: 597, height: 643 },
  town_square: { width: 2048, height: 1634 },
  cafe: { width: 533, height: 580 },
  gym: { width: 531, height: 518 },
  cinema: { width: 485, height: 508 },
  arcade: { width: 460, height: 497 },
  home: { width: 562, height: 568 },
}

type BuildingProps = {
  id: BuildingId
  name: string
  icon: string
  x: number
  y: number
  scale?: number
  hint: string
  active: boolean
  badge?: string
  onClick: (buildingId: BuildingId) => void
}

export function Building({
  id,
  name,
  x,
  y,
  scale = 0.4,
  hint,
  active,
  badge,
  onClick,
}: BuildingProps) {
  const imgSrc = BUILDING_IMAGES[id]
  const size = BUILDING_SIZES[id]
  const widthPx = Math.round(size.width * scale)
  const heightPx = Math.round(size.height * scale)

  return (
    <button
      type="button"
      className={`building ${active ? 'building-active' : ''}`}
      style={
        {
          left: `${x}px`,
          top: `${y}px`,
          '--building-w': `${widthPx}px`,
          '--building-h': `${heightPx}px`,
          '--building-z': `${Math.max(4, Math.round(y / 24))}`,
        } as React.CSSProperties
      }
      onClick={() => onClick(id)}
      aria-label={name}
    >
      <div className="building-body building-body-img">
        <img
          src={imgSrc}
          alt={name}
          className="building-img"
          draggable={false}
        />
        {badge ? <span className="building-badge">{badge}</span> : null}
      </div>
      <div className="building-label">
        <strong>{name}</strong>
        <span>{hint}</span>
      </div>
    </button>
  )
}
