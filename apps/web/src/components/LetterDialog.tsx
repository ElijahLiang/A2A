import { useState, useEffect, useRef } from 'react'
import './LetterDialog.css'
import { apiUrl } from '../config/apiBase'
import type { TownAgent } from '../data/agents'

interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

interface LetterDialogProps {
  agent: TownAgent
  onClose: () => void
}

export function LetterDialog({ agent, onClose }: LetterDialogProps) {
  const [phase, setPhase] = useState<'envelope' | 'opening' | 'chat'>('envelope')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('opening'), 400)
    const t2 = setTimeout(() => {
      setPhase('chat')
      setMessages([{
        role: 'agent',
        content: `嗨！我是${agent.name}，${agent.status}。有什么想聊的吗？想约我一起做点什么？`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [agent.name, agent.status])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const chatHistory = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }))

    try {
      const resp = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: agent.name,
          message: text,
          history: chatHistory,
        }),
      })

      const data = await resp.json()
      const reply: string = data.reply || '（思考中...）'

      setMessages(prev => [...prev, {
        role: 'agent',
        content: reply,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: '抱歉，我好像走神了...能再说一次吗？',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="letter-overlay" onClick={onClose}>
      <div className={`letter-container letter-phase-${phase}`} onClick={e => e.stopPropagation()}>
        {/* Envelope animation */}
        <div className="letter-envelope">
          <div className="envelope-body">
            <div className="envelope-stamp">A2A</div>
            <div className="envelope-to">来自小镇的对话</div>
            <div className="envelope-from">{agent.name}</div>
          </div>
          <div className="envelope-flap" />
        </div>

        {/* Chat interface */}
        <div className="letter-paper letter-chat-paper">
          <div className="letter-header">
            <div className="letter-avatar-row">
              <div className="letter-avatar">
                <div className="sprite-layers" style={{ width: 48, height: 48 }}>
                  {agent.layers.slice(0, 3).map((src, i) => (
                    <div key={i} style={{
                      position: 'absolute', inset: 0, width: 48, height: 48,
                      backgroundImage: `url(${src})`,
                      backgroundSize: '768px 768px',
                      backgroundPosition: '0 0',
                      imageRendering: 'pixelated' as const,
                    }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="letter-name">{agent.name}</div>
                <div className="letter-status">{agent.status}</div>
              </div>
            </div>
            <button className="letter-close" onClick={onClose}>x</button>
          </div>

          <div className="letter-divider" />

          {/* Chat messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                <div className="chat-msg-bubble">
                  {msg.content}
                </div>
                <div className="chat-msg-time">{msg.timestamp}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-agent">
                <div className="chat-msg-bubble chat-typing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              type="text"
              placeholder={`和 ${agent.name} 说点什么...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
