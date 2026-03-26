import { Link } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import './FriendList.css'

type FriendListProps = {
  open: boolean
  onClose: () => void
}

export function FriendList({ open, onClose }: FriendListProps) {
  const { friends } = useGame()

  if (!open) return null

  return (
    <div className="friend-list-overlay" role="dialog" aria-label="好友列表">
      <div className="friend-list-panel pixel-card">
        <div className="friend-list-header">
          <h2 className="friend-list-title">好友</h2>
          <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={onClose}>
            关闭
          </button>
        </div>
        {friends.length === 0 ? (
          <p className="friend-list-empty">暂无好友。会面结算时可勾选「加为好友」。</p>
        ) : (
          <ul className="friend-list">
            {friends.map((f) => (
              <li key={`${f.userId}-${f.friendId}`} className="friend-list-item">
                <span className="friend-list-id">{f.friendId}</span>
                <span className="friend-list-src">{f.source === 'meetup' ? '会面' : '许愿'}</span>
                <Link
                  to={`/pixel-home?visit=${encodeURIComponent(f.friendId)}`}
                  className="pixel-btn pixel-btn-secondary pixel-btn-small friend-list-visit"
                  onClick={onClose}
                >
                  串门
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
