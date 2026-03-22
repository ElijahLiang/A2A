import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

export function Landing() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(0)
  const [doorClicked, setDoorClicked] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleDoorClick = useCallback(() => {
    if (doorClicked) return
    setDoorClicked(true)
    setTimeout(() => navigate('/login'), 1200)
  }, [doorClicked, navigate])

  return (
    <div className={`boot-screen ${doorClicked ? 'boot-whiteout' : ''}`}>
      <div className="boot-bg">
        <img src="/boot-bg.png" alt="" draggable={false} />
      </div>

      <div className="boot-scanlines" />

      <div className="boot-content">
        {phase >= 1 && (
          <div className="boot-logo animate-logo">
            <span className="logo-char">A</span>
            <span className="logo-char logo-delay-1">2</span>
            <span className="logo-char logo-delay-2">A</span>
          </div>
        )}

        {phase >= 2 && (
          <div className="boot-subtitle animate-fade">
            Avatar To Avatar
          </div>
        )}

        {phase >= 3 && (
          <div className="boot-tagline animate-typewriter">
            在像素小镇，让 AI 替你交朋友
          </div>
        )}
      </div>

      {phase >= 4 && (
        <button
          className={`boot-door-btn ${doorClicked ? 'door-opening' : ''}`}
          onClick={handleDoorClick}
          aria-label="开始游戏"
        >
          <img
            src="/boot-door.png"
            alt="开始"
            className="door-img"
            draggable={false}
          />
          <span className="door-hint">▶ PRESS START ◀</span>
        </button>
      )}

      <div className="boot-footer">
        <span>A2A Stanford Town v1.0</span>
        <span>Powered by DeepSeek</span>
      </div>
    </div>
  )
}
