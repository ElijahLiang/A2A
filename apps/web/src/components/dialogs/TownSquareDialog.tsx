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
  { id: 'i1', text: '今晚想去吃火锅 🍲', time: '2 小时前', status: 'matching' },
  { id: 'i2', text: '周六下午想打羽毛球 🏸', time: '1 天前', status: 'matched' },
]

export function TownSquareDialog() {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 20 }}>
        城镇广场是所有活动的汇聚地。这里可以看到你的约定和进行中的意图。
      </p>

      {/* Active sessions */}
      <div className="section-title">🤝 即将到来的约定</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {ACTIVE_SESSIONS.map(s => (
          <div key={s.id} className="pixel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.activity} 与 {s.partner}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                ⏰ {s.time} · 📍 {s.location}
              </div>
            </div>
            <span className={`pixel-badge ${s.status === 'confirmed' ? 'pixel-badge-green' : 'pixel-badge-orange'}`}>
              {s.status === 'confirmed' ? '已确认' : '待确认'}
            </span>
          </div>
        ))}
      </div>

      {/* Recent intents */}
      <div className="section-title">📜 我的近期意图</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RECENT_INTENTS.map(intent => (
          <div key={intent.id} className="pixel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{intent.text}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-light)' }}>{intent.time}</div>
            </div>
            <span className={`pixel-badge ${intent.status === 'matching' ? 'pixel-badge-blue' : 'pixel-badge-green'}`}>
              {intent.status === 'matching' ? 'Agent 匹配中' : '已匹配'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
