import { useEffect, useState } from 'react'
import './AgentProxyDialog.css'

type AgentProxyDialogProps = {
  open: boolean
  onClose: () => void
  peerLabel: string
}

export function AgentProxyDialog({ open, onClose, peerLabel }: AgentProxyDialogProps) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) {
      setText('')
      setSent(false)
    }
  }, [open])

  if (!open) return null

  const handleSend = () => {
    const t = text.trim()
    if (t.length < 2) return
    setSent(true)
  }

  return (
    <div className="agent-proxy-overlay" role="dialog" aria-label="Agent 代聊" aria-modal="true">
      <div className="agent-proxy-panel pixel-card">
        <div className="agent-proxy-title">Agent 代聊</div>
        <p className="agent-proxy-desc">
          你与 <strong>{peerLabel}</strong> 不直接对话；内容由 Agent 转述给对方，以保护双方节奏与边界。
        </p>
        {sent ? (
          <p className="agent-proxy-success" role="status">
            已记录，Agent 将在合适时机转达（演示环境未接后端）。
          </p>
        ) : (
          <>
            <textarea
              className="pixel-textarea agent-proxy-input"
              placeholder="想对对方说的话…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
            <div className="agent-proxy-actions">
              <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={onClose}>
                关闭
              </button>
              <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={handleSend}>
                发送给 Agent
              </button>
            </div>
          </>
        )}
        {sent ? (
          <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small agent-proxy-done" onClick={onClose}>
            完成
          </button>
        ) : null}
      </div>
    </div>
  )
}
