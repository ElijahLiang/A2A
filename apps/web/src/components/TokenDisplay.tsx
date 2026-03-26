import { useEffect, useRef, useState } from 'react'
import { useToken } from '../contexts/TokenContext'
import './TokenDisplay.css'

type FloatItem = { id: string; text: string; kind: 'earn' | 'spend' }

export function TokenDisplay() {
  const { balance } = useToken()
  const prev = useRef(balance)
  const [floats, setFloats] = useState<FloatItem[]>([])

  useEffect(() => {
    const delta = balance - prev.current
    prev.current = balance
    if (delta === 0) return

    const id = crypto.randomUUID()
    const kind = delta > 0 ? 'earn' : 'spend'
    const text = delta > 0 ? `+${delta}` : `${delta}`
    setFloats((f) => [...f, { id, text, kind }])

    const t = window.setTimeout(() => {
      setFloats((f) => f.filter((x) => x.id !== id))
    }, 700)
    return () => clearTimeout(t)
  }, [balance])

  return (
    <div className="token-display" title="小镇代币">
      <span className="token-display-icon" aria-hidden>
        🪙
      </span>
      <span className="token-display-balance">{balance}</span>
      <div className="token-display-floats" aria-hidden>
        {floats.map((f) => (
          <span
            key={f.id}
            className={`token-display-delta token-display-delta--${f.kind}`}
          >
            {f.text}
          </span>
        ))}
      </div>
    </div>
  )
}
