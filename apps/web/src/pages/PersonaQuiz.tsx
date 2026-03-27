import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiUrl } from '../config/apiBase'
import { STORAGE_KEYS } from '../services/storage'
import './PersonaQuiz.css'

type RevealResult = {
  agentName: string
  personality: string
  traits: string[]
  summary: string
  agentDesc: string
  mbti: string
  catHint: string
}

export function PersonaQuiz({ onComplete }: { onComplete: (agentName: string) => void }) {
  const navigate = useNavigate()
  const { updateBio, applyAfterRegister, user } = useAuth()
  const [bio, setBio] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<RevealResult | null>(null)
  const [revealPhase, setRevealPhase] = useState(0)

  const phone = (
    user?.phone ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PHONE) : null) ||
    ''
  )
    .replace(/\D/g, '')
    .slice(0, 11)

  const handleSubmit = async () => {
    const trimmed = bio.trim()
    if (!trimmed || !apiKey.trim() || flipping) return
    if (phone.length < 11) {
      setSubmitError('请先在登录页填写 11 位手机号')
      return
    }
    setFlipping(true)
    setSubmitError(null)

    try {
      const url = apiUrl('/api/register')
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          bio: trimmed,
          api_key: apiKey.trim(),
          api_base_url: apiBaseUrl.trim() || undefined,
        }),
      })
      let data: {
        code?: number
        data?: {
          user_id: string
          agent_name: string
          personality: string
          interests: string[]
          lucky_place: string
        }
        message?: string
        detail?: string | Array<{ msg?: string }>
      }
      try {
        data = (await res.json()) as typeof data
      } catch {
        setSubmitError(`服务器返回非 JSON（HTTP ${res.status}）。请确认后端已启动：apps/agent 下执行 python main.py`)
        setFlipping(false)
        return
      }

      if (!res.ok || (data.code !== 200 && data.code !== 0)) {
        let errMsg: string
        if (typeof data.detail === 'string') {
          errMsg = data.detail
        } else if (Array.isArray(data.detail)) {
          errMsg = data.detail.map((x) => x.msg || '').filter(Boolean).join('；') || `注册失败 (${res.status})`
        } else {
          errMsg = data.message || `注册失败 (${res.status})`
        }
        if (errMsg === 'database unavailable') {
          errMsg =
            '后端仍是旧版本或未重启：请在终端停止当前进程（Ctrl+C），进入 apps/agent 后重新执行 python main.py。最新代码在无数据库时也可完成注册，无需 Docker。若需要信件/数据长期保存，再安装 Docker 并启动 infra/docker-compose.dev.yml 中的 PostgreSQL。'
        }
        setSubmitError(errMsg)
        setFlipping(false)
        return
      }

      if (!data.data) {
        setSubmitError('服务器返回数据异常')
        setFlipping(false)
        return
      }

      const d = data.data
      applyAfterRegister({
        userId: d.user_id,
        phone,
        bio: trimmed,
        agentName: d.agent_name,
      })
      updateBio(trimmed)

      setResult({
        agentName: d.agent_name,
        mbti: '',
        traits: d.interests ?? [],
        summary: d.personality,
        agentDesc: d.personality,
        personality: d.personality,
        catHint: '',
      })
      setFlipping(false)

      setTimeout(() => setRevealPhase(1), 500)
      setTimeout(() => setRevealPhase(2), 1500)
      setTimeout(() => setRevealPhase(3), 2500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSubmitError(
        `网络错误：${msg}。请确认已在 apps/agent 启动后端（python main.py），且本页通过 pnpm dev 打开（走 /api 代理）。`,
      )
      setFlipping(false)
    }
  }

  const handleEnterTown = () => {
    if (result) onComplete(result.agentName)
    navigate('/town')
  }

  if (result) {
    return (
      <div className="quiz-screen">
        <div className="quiz-dm quiz-dm--reveal" role="region" aria-label="邮差猫">
          <div className="quiz-dm-mascot" aria-hidden>
            🐱
          </div>
          <div className="quiz-dm-bubble quiz-dm-bubble--static">
            <p className="quiz-dm-text">邮差猫：拆信完毕！这就是我读到的你喵～</p>
          </div>
        </div>

        <div className="quiz-reveal">
          {revealPhase >= 1 && (
            <div className="reveal-envelope animate-envelope">
              <div className="reveal-seal">A2A</div>
            </div>
          )}
          {revealPhase >= 2 && (
            <div className="reveal-result animate-result">
              {result.mbti ? <div className="reveal-mbti-tag">{result.mbti}</div> : null}
              <div className="reveal-bio-line">「{bio.trim()}」</div>
              <div className="reveal-name">你的分身：{result.agentName}</div>
              <p className="reveal-agent-desc">{result.agentDesc}</p>
              <p className="reveal-desc">{result.summary}</p>
              {result.traits.length > 0 && (
                <div className="reveal-traits" aria-label="兴趣标签">
                  {result.traits.map((t) => (
                    <span key={t} className="reveal-trait-pill">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {revealPhase >= 3 && (
            <button className="reveal-enter" onClick={handleEnterTown}>
              进入 A2A 小镇
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-screen quiz-screen--with-dm">
      <div className="quiz-persona-layout">
        <div className="quiz-dm">
          <div className="quiz-dm-mascot" aria-hidden>
            🐱
          </div>
          <div className="quiz-dm-bubble">
            <p className="quiz-dm-label">邮差猫 DM</p>
            <p className="quiz-dm-text">
              带上你的 API Key，分身才能在小镇里替你生活、社交喵～（密钥仅加密存服务端）
            </p>
          </div>
        </div>

        <div className={`quiz-card ${flipping ? 'quiz-card-flip' : ''}`}>
          <div className="quiz-card-inner quiz-card-inner--bio">
            <div className="quiz-question-num">PROFILE</div>
            <label className="quiz-bio-label" htmlFor="persona-bio">
              用一句话形容一下自己
            </label>
            <textarea
              id="persona-bio"
              className="quiz-textarea"
              rows={4}
              maxLength={120}
              placeholder="例如：喜欢安静写代码，偶尔也会想找人喝一杯。"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={flipping}
            />
            <p className="quiz-bio-hint">{bio.length}/120</p>

            <label className="quiz-bio-label" htmlFor="persona-api-key" style={{ marginTop: 16 }}>
              API Key（驱动你的分身）
            </label>
            <input
              id="persona-api-key"
              className="quiz-textarea"
              style={{ minHeight: 44 }}
              type="password"
              autoComplete="off"
              placeholder="OpenAI / DeepSeek 兼容 Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={flipping}
            />

            <button
              type="button"
              className="quiz-live-preview"
              style={{ cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? '收起高级设置' : '高级设置（可选 Base URL）'}
            </button>
            {showAdvanced && (
              <input
                className="quiz-textarea"
                style={{ minHeight: 44, marginTop: 8 }}
                type="url"
                placeholder="https://api.openai.com/v1"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                disabled={flipping}
              />
            )}

            {phone.length < 11 && (
              <p className="quiz-live-preview" role="alert">
                需要有效手机号：请返回登录页填写 11 位号码后再来。
              </p>
            )}
            {submitError && (
              <p className="quiz-live-preview" role="alert" style={{ color: '#e8a598' }}>
                {submitError}
              </p>
            )}
            {bio.trim().length >= 6 && (
              <p className="quiz-live-preview" aria-live="polite">
                提交后由服务端 LLM 生成你的分身与人格（V2 不再本地推断 MBTI）。
              </p>
            )}
            <button
              type="button"
              className="quiz-submit-bio"
              onClick={() => void handleSubmit()}
              disabled={!bio.trim() || !apiKey.trim() || flipping || phone.length < 11}
            >
              确认并继续
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
