import './PlayerAvatar.css'

type PlayerAvatarProps = {
  row: number
  col: number
  agentStatus?: string
}

export function PlayerAvatar({ row, col, agentStatus }: PlayerAvatarProps) {
  return (
    <div
      className="player-avatar"
      style={{
        gridRow: `${row} / span 1`,
        gridColumn: `${col} / span 1`,
      }}
    >
      <div className="player-sprite" aria-hidden="true">
        <span className="sprite-head" />
        <span className="sprite-body" />
        <span className="sprite-feet" />
      </div>
      {agentStatus ? <div className="player-bubble">{agentStatus}</div> : null}
    </div>
  )
}
