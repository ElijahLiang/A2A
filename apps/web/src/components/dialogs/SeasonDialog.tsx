import { useGame } from '../../contexts/GameContext'
import './SeasonDialog.css'

type SeasonDialogProps = {
  onClose: () => void
}

export function SeasonDialog({ onClose }: SeasonDialogProps) {
  const { currentSeason, stamps } = useGame()
  const season = currentSeason

  const meetupDone = stamps.some((s) => s.meetupId && s.meetupId.startsWith('meetup-')) ? 1 : 0
  const stampCount = stamps.length

  return (
    <div className="season-overlay" role="dialog" aria-modal="true" aria-label="赛季任务">
      <div className="season-panel pixel-card">
        <div className="season-header">
          <h2 className="season-title">{season?.name ?? '当前赛季'}</h2>
          <button type="button" className="pixel-btn pixel-btn-secondary pixel-btn-small" onClick={onClose}>
            关闭
          </button>
        </div>
        {season ? (
          <p className="season-range">
            {new Date(season.startDate).toLocaleDateString('zh-CN')} — {new Date(season.endDate).toLocaleDateString('zh-CN')}
          </p>
        ) : null}
        <div className="section-title">任务与进度</div>
        <ul className="season-tasks">
          {(season?.tasks ?? []).map((t) => {
            const progress =
              t.id === 'meet-once'
                ? Math.min(meetupDone, t.target)
                : t.id === 'stamps-3'
                  ? Math.min(stampCount, t.target)
                  : 0
            const pct = Math.min(100, Math.round((progress / t.target) * 100))
            return (
              <li key={t.id} className="season-task-row">
                <div className="season-task-desc">{t.description}</div>
                <div className="season-task-progress">
                  <div className="pixel-progress">
                    <div className="pixel-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="season-task-num">
                    {progress}/{t.target}
                  </span>
                </div>
                <div className="season-task-reward">
                  奖励：{t.reward.token ? `${t.reward.token} 代币` : ''}
                  {t.reward.title ? ` · ${t.reward.title}` : ''}
                </div>
              </li>
            )
          })}
        </ul>
        {season?.limitedStamps?.length ? (
          <p className="season-foot">限定邮戳：{season.limitedStamps.join('、')}</p>
        ) : null}
      </div>
    </div>
  )
}
