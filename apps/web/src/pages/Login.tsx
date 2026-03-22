import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export function Login({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const sendCode = () => {
    if (phone.length < 11) return
    setCodeSent(true)
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); return 0 } return p - 1 })
    }, 1000)
  }

  const handleLogin = () => {
    if (code.length >= 4) onLogin()
  }

  return (
    <div className="login-screen">
      <div className="login-bg" />
      <div className="login-vignette" />

      <div className="login-card">
        <div className="login-card-header">
          <div className="login-card-badge">TOWN PASS</div>
          <div className="login-card-title">小镇通行证</div>
          <div className="login-card-sub">验证身份后进入人格测试</div>
        </div>

        <div className="login-card-body">
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
            进入人格测试
          </button>
        </div>

        <button className="login-back" onClick={() => navigate('/')}>
          ← 返回
        </button>
      </div>
    </div>
  )
}
