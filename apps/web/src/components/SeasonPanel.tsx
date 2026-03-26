import { useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import './SeasonPanel.css'

export function SeasonPanel() {
  const { currentSeason, stamps } = useGame()

  const taskProgress = useMemo(() => {
    if (!currentSeason) return []
    return currentSeason.tasks.map((task) => {
      const cur =
        task.id === 'meet-once' ? (stamps.length >= 1 ? 1 : 0) : Math.min(stamps.length, task.target)
      return { task, current: cur }
    })
  }, [currentSeason, stamps])

  if (!currentSeason) return null

  const end = new Date(currentSeason.endDate)

  return (
    <section className="season-panel">
      <div className="season-panel-head">
        <span className="season-panel-badge">赛季</span>
        <h2 className="season-panel-title">{currentSeason.name}</h2>
        <p className="season-panel-meta">截止 {end.toLocaleDateString()}</p>
      </div>
      <ul className="season-panel-tasks">
        {taskProgress.map(({ task, current }) => (
          <li key={task.id} className="season-panel-task">
            <span className="season-panel-task-desc">{task.description}</span>
            <span className="season-panel-task-num">
              {current}/{task.target}
            </span>
            <span className="season-panel-task-reward">
              +{task.reward.token} 币
              {task.reward.title ? ` · ${task.reward.title}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
