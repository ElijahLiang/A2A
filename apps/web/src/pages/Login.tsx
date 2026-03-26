import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../services/storage'
import './Login.css'

export function Login({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [avatarColor, setAvatarColor] = useState<'blue' | 'green'>(() => {
    const v = localStorage.getItem(STORAGE_KEYS.AVATAR_COLOR)
    return v === 'green' ? 'green' : 'blue'
  })

  const sendCode = () => {
    if (phone.length < 11) return
    setCodeSent(true)
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); return 0 } return p - 1 })
    }, 1000)
  }

  const handleLogin = () => {
    if (code.length < 4) return
    localStorage.setItem(STORAGE_KEYS.AVATAR_COLOR, avatarColor)
    onLogin()
  }

  return (
    <div className="login-screen">
      <div className="login-bg" />
      <div className="login-vignette" />

      <div className="login-card">
        <div className="login-card-header">
          <div className="login-card-badge">TOWN PASS</div>
          <div className="login-card-title">小镇通行证</div>
          <div className="login-card-sub">验证身份后用一句话介绍自己</div>
        </div>

        <div className="login-card-body">
          <div className="login-field">
            <label className="login-label">形象主色</label>
            <div className="login-avatar-row" role="radiogroup" aria-label="头像主色">
              <button
                type="button"
                className={`login-avatar-opt ${avatarColor === 'blue' ? 'is-selected' : ''}`}
                onClick={() => setAvatarColor('blue')}
                aria-pressed={avatarColor === 'blue'}
              >
                <span className="login-avatar-swatch login-avatar-swatch--blue" aria-hidden />
                蓝调
              </button>
              <button
                type="button"
                className={`login-avatar-opt ${avatarColor === 'green' ? 'is-selected' : ''}`}
                onClick={() => setAvatarColor('green')}
                aria-pressed={avatarColor === 'green'}
              >
                <span className="login-avatar-swatch login-avatar-swatch--green" aria-hidden />
                绿调
              </button>
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">手机号码</label>
            <input
              className="login-input"
              type="tel"
              placeholder="输入 11 位手机号"
              maxLength={11}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="login-field">
            <label className="login-label">验证码</label>
            <div className="login-code-row">
              <input
                className="login-input"
                type="text"
                placeholder="输入验证码"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <button
                className="login-send-btn"
                onClick={sendCode}
                disabled={countdown > 0 || phone.length < 11}
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? '重发' : '发送'}
              </button>
            </div>
          </div>

          <button
            className="login-submit"
            onClick={handleLogin}
            disabled={code.length < 4}
          >
            继续
          </button>
        </div>

        <button className="login-back" onClick={() => navigate('/')}>
          ← 返回
        </button>
      </div>
    </div>
  )
}
