import { useState } from 'react'

const TIME_OPTIONS = [
  { value: 'today-lunch', label: '今天中午' },
  { value: 'today-night', label: '今晚' },
  { value: 'tomorrow', label: '明天' },
  { value: 'weekend', label: '周末' },
]

const SIZE_OPTIONS = ['1 人', '2 人', '3-4 人', '不限']

type IntentDialogProps = {
  activityType: string
  activityLabel: string
  onDone: () => void
}

export function IntentDialog({ activityType, activityLabel, onDone }: IntentDialogProps) {
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('today-night')
  const [groupSize, setGroupSize] = useState('2 人')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="dialog-stack">
        <div className="pixel-card">
          <div className="dialog-box-title">Avatar 已出发</div>
          <p>
            你的 `{activityType}` 意图已投递到 {activityLabel}。系统会先筛选共鸣对象，再把结果送到邮局。
          </p>
          <div className="pixel-progress">
            <div className="pixel-progress-fill" style={{ width: '62%' }} />
          </div>
        </div>
        <button type="button" className="pixel-btn pixel-btn-primary" onClick={onDone}>
          回到地图
        </button>
      </div>
    )
  }

  return (
    <div className="dialog-stack">
      <div>
        <label className="pixel-label">活动描述</label>
        <textarea
          className="pixel-textarea"
          placeholder={`例如：想在${activityLabel}找一个聊得来的人，一起轻松度过 2 小时。`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={160}
        />
      </div>

      <div>
        <label className="pixel-label">时间</label>
        <div className="choice-row">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`pixel-btn pixel-btn-small choice-btn ${
                time === option.value ? 'pixel-btn-primary' : 'pixel-btn-secondary'
              }`}
              onClick={() => setTime(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="pixel-label">人数</label>
        <div className="choice-row">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`pixel-btn pixel-btn-small choice-btn ${
                groupSize === option ? 'pixel-btn-primary' : 'pixel-btn-secondary'
              }`}
              onClick={() => setGroupSize(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="pixel-card">
        <div className="section-title">Agent Brief</div>
        <p style={{ margin: 0, lineHeight: 1.8 }}>
          Avatar 会优先找近期活跃、偏好 {activityLabel}、对话节奏相近的人，再根据时间与人数偏好过滤。
        </p>
      </div>

      <button
        type="button"
        className="pixel-btn pixel-btn-primary"
        onClick={() => setSubmitted(true)}
        disabled={description.trim().length < 8}
      >
        派出 Avatar
      </button>
    </div>
  )
}
