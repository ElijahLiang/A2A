import type { SquareCat } from '../../types'
import './CatActivityDialog.css'

type CatActivityDialogProps = {
  cat: SquareCat
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  coffee: '咖啡 / 闲聊',
  study: '学习 / 自习',
  dining: '聚餐 / 约饭',
  sports: '运动',
  movie: '观影',
  gaming: '游戏',
}

export function CatActivityDialog({ cat, onClose }: CatActivityDialogProps) {
  const label = TYPE_LABEL[cat.activityType] ?? cat.activityType

  return (
    <div className="cat-activity-overlay" role="dialog" aria-modal="true" aria-label="广场猫活动信息">
      <div className="cat-activity-panel pixel-card">
        <div className="cat-activity-title">广场猫</div>
        <p className="cat-activity-lead">
          这只猫代表当前赛季在广场上<strong>与「{label}」相关</strong>的活跃匹配氛围。
        </p>
        <ul className="cat-activity-meta">
          <li>活动类型：{cat.activityType}</li>
          {cat.carriedActivityId ? <li>关联活动：{cat.carriedActivityId}</li> : <li>暂无绑定活动（演示数据）</li>}
          <li>
            出现时间：{new Date(cat.appearsAt).toLocaleDateString('zh-CN')} —{' '}
            {new Date(cat.expiresAt).toLocaleDateString('zh-CN')}
          </li>
        </ul>
        <p className="cat-activity-hint">在「城镇广场」打开许愿池可看到更多全镇动态。</p>
        <button type="button" className="pixel-btn pixel-btn-primary pixel-btn-small" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  )
}
