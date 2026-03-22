const BIG_FIVE = [
  { label: '开放性', description: '喜欢新鲜场景、乐于探索陌生活动。' },
  { label: '尽责性', description: '答应了就会认真赴约，临时变动少。' },
  { label: '外向性', description: '愿意主动破冰，但更喜欢小范围高质量交流。' },
  { label: '宜人性', description: '对话耐心、愿意倾听，也愿意照顾对方感受。' },
  { label: '情绪稳定', description: '偏好低压、清晰、不会过度拉扯的见面节奏。' },
]

const TAGS = ['慢热但真诚', '愿意深聊', '偏爱小局', '喜欢有主题的活动', '讨厌无效闲聊']
const PREFERENCES = ['第一次见面优先咖啡馆或图书馆', '更喜欢提前敲定时间地点', '接受 1v1 或 2-3 人小组', '偏好傍晚或周末活动']

export function HomeDialog() {
  return (
    <div className="dialog-stack">
      <div className="info-grid">
        <div className="info-card">
          <strong>人格画像</strong>
          温和、好奇、对高质量社交有明确偏好。
        </div>
        <div className="info-card">
          <strong>社交节奏</strong>
          先由 Agent 预热，再进入线下见面更自然。
        </div>
        <div className="info-card">
          <strong>理想邀约</strong>
          有主题、有边界、见面时长在 1-3 小时之间。
        </div>
      </div>

      <div>
        <div className="section-title">Big Five 画像</div>
        <div className="status-list">
          {BIG_FIVE.map((item) => (
            <div key={item.label} className="status-item">
              <div className="status-item-title">{item.label}</div>
              <div>{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="section-title">性格标签</div>
        <div className="tag-row">
          {TAGS.map((tag) => (
            <span key={tag} className="resonance-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="section-title">社交偏好与设置</div>
        <div className="status-list">
          {PREFERENCES.map((preference) => (
            <div key={preference} className="status-item">
              {preference}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
