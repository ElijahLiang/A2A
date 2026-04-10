import { useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { useToken } from '../../contexts/TokenContext'
import type { Wish } from '../../types'
import './TownSquareDialog.css'

const ACTIVE_SESSIONS = [
  {
    id: '1',
    partner: '小红 👩‍🎨',
    activity: '🍲 火锅',
    time: '今晚 18:30',
    location: '海底捞(大学城店)',
    status: 'pending' as const,
  },
  {
    id: '2',
    partner: '阿杰 🧑‍💻',
    activity: '🏸 羽毛球',
    time: '周六 15:00',
    location: '校体育馆 3 号场',
    status: 'confirmed' as const,
  },
]

const RECENT_INTENTS = [
  { id: 'i1', text: '今晚想去吃火锅 🍲', time: '2 小时前', status: 'matching' as const },
  { id: 'i2', text: '周六下午想打羽毛球 🏸', time: '1 天前', status: 'matched' as const },
]

type RecruitRow = {
  id: string
  title: string
  applicants: number
  pending: string[]
  expiresAt: number
  closed: boolean
}

const TABS = [
  { key: 'meetups' as const, icon: '🤝', label: '约定' },
  { key: 'wishes' as const, icon: '💫', label: '许愿池' },
  { key: 'recruits' as const, icon: '📣', label: '招募' },
  { key: 'intents' as const, icon: '📜', label: '意图' },
]
type Tab = (typeof TABS)[number]['key']

export function TownSquareDialog() {
  const { submitWish, pickWish, floatingWishes, completePickedWish } = useGame()
  const { canAfford } = useToken()
  const [activeTab, setActiveTab] = useState<Tab>('meetups')
  const [draft, setDraft] = useState('')
  const [hint, setHint] = useState('')
  const [picked, setPicked] = useState<Wish | null>(null)
  const [recruits, setRecruits] = useState<RecruitRow[]>(() => [
    {
      id: 'rec-1',
      title: '咖啡馆 · 闲聊局',
      applicants: 3,
      pending: ['user-a', 'user-b'],
      expiresAt: Date.now() + 36 * 3600000,
      closed: false,
    },
  ])

  const onSubmitWish = () => {
    setHint('')
    const ok = submitWish(draft)
    if (ok) {
      setDraft('')
      setHint('心愿已投入许愿池（-1 币）')
    } else {
      setHint(!canAfford(1) ? '代币不足' : '至少 4 个字')
    }
  }

  const onPick = () => {
    setHint('')
    const w = pickWish()
    if (!w) {
      setHint('暂无可捞心愿')
      setPicked(null)
      return
    }
    setPicked(w)
  }

  const onCompletePicked = () => {
    if (!picked) return
    completePickedWish(picked.id)
    setPicked(null)
    setHint('已标记完成')
  }

  const extendRecruit = (id: string) => {
    setRecruits((rows) =>
      rows.map((r) => (r.id === id ? { ...r, expiresAt: r.expiresAt + 24 * 3600000 } : r)),
    )
    setHint('已延长招募 24 小时（演示）')
  }

  const closeRecruit = (id: string) => {
    setRecruits((rows) => rows.map((r) => (r.id === id ? { ...r, closed: true } : r)))
    setHint('已关闭招募（演示）')
  }

  const approveApplicant = (recruitId: string, uid: string) => {
    setRecruits((rows) =>
      rows.map((r) =>
        r.id === recruitId
          ? { ...r, pending: r.pending.filter((x) => x !== uid), applicants: Math.max(0, r.applicants - 1) }
          : r,
      ),
    )
    setHint(`已接受申请：${uid}（演示）`)
  }

  const rejectApplicant = (recruitId: string, uid: string) => {
    setRecruits((rows) =>
      rows.map((r) =>
        r.id === recruitId ? { ...r, pending: r.pending.filter((x) => x !== uid) } : r,
      ),
    )
    setHint(`已婉拒：${uid}（演示）`)
  }

  return (
    <div className="town-square-dialog">
      <div className="tsq-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tsq-tab ${activeTab === tab.key ? 'tsq-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tsq-tab-icon">{tab.icon}</span>
            <span className="tsq-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tsq-panel" role="tabpanel">
        {activeTab === 'meetups' && (
          <div className="tsq-section">
            {ACTIVE_SESSIONS.length === 0 ? (
              <p className="tsq-empty">暂无即将到来的约定</p>
            ) : (
              <ul className="town-square-list">
                {ACTIVE_SESSIONS.map((s) => (
                  <li key={s.id} className="town-square-card">
                    <div>
                      <div className="town-square-card-title">
                        {s.activity} 与 {s.partner}
                      </div>
                      <div className="town-square-card-meta">
                        ⏰ {s.time} · 📍 {s.location}
                      </div>
                    </div>
                    <span
                      className={`pixel-badge ${s.status === 'confirmed' ? 'pixel-badge-green' : 'pixel-badge-orange'}`}
                    >
                      {s.status === 'confirmed' ? '已确认' : '待确认'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'wishes' && (
          <div className="tsq-section">
            <p className="town-square-hint">投入心愿消耗 1 枚代币；捞取他人心愿不扣币（MVP）。</p>
            <div className="town-square-wish-form">
              <textarea
                className="pixel-textarea town-square-textarea"
                placeholder="写一句心愿，例如：想找人一起周末看展"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={120}
                rows={3}
              />
              <div className="town-square-wish-actions">
                <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={onSubmitWish}>
                  投入心愿 (−1)
                </button>
                <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={onPick}>
                  随机捞一条
                </button>
              </div>
              {hint ? <p className="town-square-msg">{hint}</p> : null}
              {picked ? (
                <div className="town-square-picked pixel-card">
                  <div className="town-square-picked-label">捞到的纸条</div>
                  <p className="town-square-picked-text">{picked.content}</p>
                  <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={onCompletePicked}>
                    标记完成
                  </button>
                </div>
              ) : null}
              <p className="town-square-pool-meta">池中约 {floatingWishes.length} 条心愿漂浮中</p>
            </div>
          </div>
        )}

        {activeTab === 'recruits' && (
          <div className="tsq-section">
            <p className="town-square-hint">关闭招募或延长 24h；多人活动可逐一审批申请。</p>
            {hint ? <p className="town-square-msg">{hint}</p> : null}
            <ul className="town-square-list">
              {recruits.map((r) => (
                <li key={r.id} className="town-square-card town-square-card--recruit">
                  <div>
                    <div className="town-square-card-title">{r.title}</div>
                    <div className="town-square-card-meta">
                      {r.closed ? '已关闭' : `招募中 · ${r.applicants} 人意向 · 截止 ${new Date(r.expiresAt).toLocaleString('zh-CN')}`}
                    </div>
                    {!r.closed && r.pending.length > 0 ? (
                      <ul className="town-square-pending">
                        {r.pending.map((uid) => (
                          <li key={uid} className="town-square-pending-row">
                            <span>{uid}</span>
                            <span className="town-square-pending-actions">
                              <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={() => approveApplicant(r.id, uid)}>
                                接受
                              </button>
                              <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => rejectApplicant(r.id, uid)}>
                                婉拒
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="town-square-recruit-actions">
                    {!r.closed ? (
                      <>
                        <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => extendRecruit(r.id)}>
                          延长 24h
                        </button>
                        <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={() => closeRecruit(r.id)}>
                          关闭招募
                        </button>
                      </>
                    ) : (
                      <span className="pixel-badge pixel-badge-gray">已结束</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'intents' && (
          <div className="tsq-section">
            <ul className="town-square-list">
              {RECENT_INTENTS.map((intent) => (
                <li key={intent.id} className="town-square-card">
                  <div>
                    <div className="town-square-card-title">{intent.text}</div>
                    <div className="town-square-card-meta">{intent.time}</div>
                  </div>
                  <span
                    className={`pixel-badge ${intent.status === 'matching' ? 'pixel-badge-blue' : 'pixel-badge-green'}`}
                  >
                    {intent.status === 'matching' ? 'Agent 匹配中' : '已匹配'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
