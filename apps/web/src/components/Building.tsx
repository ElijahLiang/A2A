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
  library: '/buildings/library.png',
  post_office: '/buildings/post_office.png',
  restaurant: '/buildings/restaurant.png',
  town_square: '/buildings/town_square.png',
  cafe: '/buildings/cafe.png',
  gym: '/buildings/gym.png',
  cinema: '/buildings/cinema.png',
  arcade: '/buildings/arcade.png',
  home: '/buildings/home.png',
}

type BuildingProps = {
  id: BuildingId
  name: string
  icon: string
  row: number
  col: number
  width?: number
  height?: number
  hint: string
  active: boolean
  badge?: string
  onClick: (buildingId: BuildingId) => void
}

export function Building({
  id,
  name,
  row,
  col,
  width = 2,
  height = 2,
  hint,
  active,
  badge,
  onClick,
}: BuildingProps) {
  const imgSrc = BUILDING_IMAGES[id]

  return (
    <button
      type="button"
      className={`building ${active ? 'building-active' : ''}`}
      style={{
        gridRow: `${row} / span ${height}`,
        gridColumn: `${col} / span ${width}`,
      }}
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
