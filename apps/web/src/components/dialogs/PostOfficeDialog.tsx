import { useState } from 'react'
import './PostOfficeDialog.css'

type ReportStatus = 'pending' | 'confirmed' | 'snoozed' | 'rejected'

interface Report {
  id: string
  partner: string
  activity: string
  status: string
  resonance: string[]
  chat: string[]
  icebreaker: string
  meetup: string
}

const INITIAL_REPORTS: Report[] = [
  {
    id: 'mail-1',
    partner: 'Mira',
    activity: '周六晚餐探店',
    status: '待确认',
    resonance: ['都喜欢先聊天再线下见面', '都偏好小规模聚会', '对"微醺但不失控"有相近理解'],
    chat: [
      'A: 她希望见面前先知道彼此为什么会想一起吃饭。',
      'B: 你的资料里"愿意认真选店"让她觉得很安心。',
    ],
    icebreaker: '可以先聊"最近一次吃到惊喜的店"，再自然过渡到口味和预算。',
    meetup: '建议周六 19:00 在 Palo Alto 市中心见面，先喝一杯再吃饭。',
  },
  {
    id: 'mail-2',
    partner: 'Noah',
    activity: '电影院双人场',
    status: '新通知',
    resonance: ['都想看完电影后继续散步聊天', '都不喜欢多人观影局', '都偏好提前锁定排片'],
    chat: [
      'A: 他希望对方能接受"看完再聊"，不在片中频繁说话。',
      'B: Avatar 判断你们的观影边界感很接近。',
    ],
    icebreaker: '可先交换最近最喜欢的一部电影，再看是否有同类片单。',
    meetup: '建议周日 16:30 选靠后的双人座，电影后去旁边咖啡馆复盘剧情。',
  },
]

const STATUS_CONFIG: Record<ReportStatus, { label: string; badgeClass: string }> = {
  pending:   { label: '待确认',   badgeClass: 'pixel-badge-orange' },
  confirmed: { label: '✓ 已确认', badgeClass: 'pixel-badge-green' },
  snoozed:   { label: '稍后回复', badgeClass: 'pixel-badge-blue' },
  rejected:  { label: '已拒绝',   badgeClass: 'pixel-badge-red' },
}

export function PostOfficeDialog() {
  const [statuses, setStatuses] = useState<Record<string, ReportStatus>>(
    () => Object.fromEntries(INITIAL_REPORTS.map(r => [r.id, 'pending']))
  )

  const setStatus = (id: string, s: ReportStatus) =>
    setStatuses(prev => ({ ...prev, [id]: s }))

  const activeReports = INITIAL_REPORTS.filter(r => statuses[r.id] !== 'rejected')

  if (activeReports.length === 0) {
    return (
      <div className="post-office-empty">
        <div className="post-office-empty-icon">📭</div>
        <div className="post-office-empty-text">暂无待处理邀约</div>
      </div>
    )
  }

  return (
    <div className="dialog-stack">
      <div className="status-list">
        {activeReports.map((report) => {
          const currentStatus = statuses[report.id]
          const { label, badgeClass } = STATUS_CONFIG[currentStatus]
          const isDone = currentStatus === 'confirmed' || currentStatus === 'snoozed'

          return (
            <article key={report.id} className="pixel-card">
              <div className="status-item-head">
                <div>
                  <div className="status-item-title">{report.partner}</div>
                  <div className="post-report-activity">{report.activity}</div>
                </div>
                <span className={`pixel-badge ${badgeClass}`}>{label}</span>
              </div>

              {currentStatus === 'confirmed' && (
                <div className="post-notice-confirmed">
                  已确认！Avatar 会将你的意愿转达给 {report.partner}，见面安排稍后送到你这里。
                </div>
              )}

              {currentStatus === 'snoozed' && (
                <div className="post-notice-snoozed">
                  已暂缓。邀约将保留 24 小时，回来时可继续处理。
                </div>
              )}

              {!isDone && (
                <>
                  <div className="section-title post-resonance-title">共鸣点</div>
                  <div className="tag-row">
                    {report.resonance.map((item) => (
                      <span key={item} className="resonance-tag">{item}</span>
                    ))}
                  </div>

                  <div className="section-title">Agent 对话精华</div>
                  <div className="agent-chat-box">
                    {report.chat.map((line, index) => (
                      <div key={line} className={`chat-line ${index % 2 === 0 ? 'chat-a' : 'chat-b'}`}>
                        {line}
                      </div>
                    ))}
                  </div>

                  <div className="section-title">破冰建议</div>
                  <div className="icebreaker-box">{report.icebreaker}</div>

                  <div className="section-title">见面安排</div>
                  <div className="status-item">{report.meetup}</div>
                </>
              )}

              <div className="choice-row" style={{ marginTop: isDone ? 0 : 8 }}>
                {!isDone && (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary pixel-btn-small"
                    onClick={() => setStatus(report.id, 'confirmed')}
                  >
                    确认
                  </button>
                )}
                {currentStatus === 'pending' && (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-secondary pixel-btn-small"
                    onClick={() => setStatus(report.id, 'snoozed')}
                  >
                    稍后回复
                  </button>
                )}
                {currentStatus === 'snoozed' && (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary pixel-btn-small"
                    onClick={() => setStatus(report.id, 'confirmed')}
                  >
                    确认
                  </button>
                )}
                <button
                  type="button"
                  className="pixel-btn pixel-btn-danger pixel-btn-small"
                  onClick={() => setStatus(report.id, 'rejected')}
                >
                  {isDone ? '移除' : '拒绝'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
