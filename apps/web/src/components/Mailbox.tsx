import { useState } from 'react'
import { useMail } from '../contexts/MailContext'
import { FriendList } from './FriendList'
import { MailLetter } from './MailLetter'
import './Mailbox.css'

type MailboxProps = {
  friendSlot?: boolean
}

export function Mailbox({ friendSlot = true }: MailboxProps) {
  const { letters, unreadCount, mailboxOpen, setMailboxOpen } = useMail()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [friendOpen, setFriendOpen] = useState(false)

  const hasMail = letters.length > 0
  const icon = hasMail ? '📫' : '📭'
  const list = letters.slice(0, 5)

  const toggle = () => {
    setMailboxOpen(!mailboxOpen)
    setSelectedId(null)
  }

  return (
    <div className="mailbox-cluster">
      {friendSlot ? (
        <button
          type="button"
          className="mailbox-friend-slot"
          title="好友"
          onClick={() => setFriendOpen(true)}
        >
          <span className="mailbox-friend-icon" aria-hidden>
            👥
          </span>
        </button>
      ) : null}
      <div className="mailbox-wrap">
        <button
          type="button"
          className={`mailbox-trigger ${hasMail ? 'mailbox-trigger--full' : 'mailbox-trigger--empty'}`}
          onClick={toggle}
          aria-label={hasMail ? '小镇邮箱（有新信）' : '小镇邮箱（空）'}
        >
          <span className="mailbox-icon" aria-hidden>
            {icon}
          </span>
          {unreadCount > 0 ? (
            <span className="mailbox-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          ) : null}
        </button>
      </div>

      <FriendList open={friendOpen} onClose={() => setFriendOpen(false)} />

      {mailboxOpen ? (
        <div className="mailbox-panel" role="dialog" aria-label="邮箱面板">
          <div className="mailbox-panel-header">
            <span className="mailbox-panel-title">小镇邮箱</span>
            <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => setMailboxOpen(false)}>
              关闭
            </button>
          </div>
          <div className="mailbox-panel-body">
            {selectedId ? (
              (() => {
                const letter = letters.find((l) => l.id === selectedId)
                return letter ? (
                  <MailLetter key={letter.id} letter={letter} onBack={() => setSelectedId(null)} />
                ) : null
              })()
            ) : list.length === 0 ? (
              <p className="mailbox-empty">暂无信件</p>
            ) : (
              <ul className="mailbox-list">
                {list.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      className="mailbox-list-item"
                      onClick={() => setSelectedId(l.id)}
                    >
                      <span className="mailbox-list-from">{l.fromUserId}</span>
                      <span className={`mailbox-list-status ${l.status === 'unread' ? 'is-unread' : ''}`}>
                        {l.status === 'unread' ? '未读' : '已读'}
                      </span>
                      <span className="mailbox-list-preview">{l.content.slice(0, 28)}…</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
