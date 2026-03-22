import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PersonaQuiz.css'

const QUESTIONS = [
  {
    question: '周末你更想...',
    a: { text: '约朋友去探店或聚会', dim: 'E' },
    b: { text: '一个人待着看书或打游戏', dim: 'I' },
  },
  {
    question: '聊天时你更喜欢...',
    a: { text: '聊具体的事、最近发生了什么', dim: 'S' },
    b: { text: '聊想法、未来、脑洞大开的话题', dim: 'N' },
  },
  {
    question: '做决定时你更倾向...',
    a: { text: '分析利弊，用逻辑判断', dim: 'T' },
    b: { text: '考虑感受，跟着直觉走', dim: 'F' },
  },
  {
    question: '出门旅行你更喜欢...',
    a: { text: '提前做好详细攻略', dim: 'J' },
    b: { text: '随性走，到了再说', dim: 'P' },
  },
  {
    question: '遇到分歧时你更可能...',
    a: { text: '直接说出自己的观点', dim: 'E' },
    b: { text: '先在心里想清楚再表达', dim: 'I' },
  },
]

const AGENT_MAP: Record<string, { name: string; desc: string }> = {
  INFP: { name: 'Mira', desc: '温柔的理想主义者，用诗歌和共情连接世界' },
  ENTP: { name: 'Kai', desc: '思维碰撞者，永远在寻找下一个有趣的辩题' },
  ISFP: { name: 'Luca', desc: '安静的美学家，用镜头和画笔捕捉当下' },
  ENFJ: { name: 'Yuki', desc: '温暖的引领者，善于理解和激励身边的人' },
}

function getMBTI(answers: string[]): string {
  const count: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  answers.forEach(a => { count[a] = (count[a] || 0) + 1 })
  const e_i = count.E >= count.I ? 'E' : 'I'
  const s_n = count.S >= count.N ? 'S' : 'N'
  const t_f = count.T >= count.F ? 'T' : 'F'
  const j_p = count.J >= count.P ? 'J' : 'P'
  return `${e_i}${s_n}${t_f}${j_p}`
}

export function PersonaQuiz({ onComplete }: { onComplete: (agentName: string) => void }) {
  const navigate = useNavigate()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<{ mbti: string; agent: { name: string; desc: string } } | null>(null)
  const [revealPhase, setRevealPhase] = useState(0)

  const handleAnswer = (dim: string) => {
    if (flipping) return
    const newAnswers = [...answers, dim]
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setFlipping(true)
      setTimeout(() => {
        setCurrentQ(currentQ + 1)
        setFlipping(false)
      }, 500)
    } else {
      setFlipping(true)
      setTimeout(() => {
        const mbti = getMBTI(newAnswers)
        const matched = AGENT_MAP[mbti] || AGENT_MAP.INFP
        setResult({ mbti, agent: matched })
        setTimeout(() => setRevealPhase(1), 500)
        setTimeout(() => setRevealPhase(2), 1500)
        setTimeout(() => setRevealPhase(3), 2500)
      }, 600)
    }
  }

  const handleEnterTown = () => {
    if (result) {
      onComplete(result.agent.name)
      navigate('/town')
    }
  }

  if (result) {
    return (
      <div className="quiz-screen">
        <div className="quiz-reveal">
          {revealPhase >= 1 && (
            <div className="reveal-envelope animate-envelope">
              <div className="reveal-seal">A2A</div>
            </div>
          )}
          {revealPhase >= 2 && (
            <div className="reveal-result animate-result">
              <div className="reveal-mbti">{result.mbti}</div>
              <div className="reveal-name">你的分身是：{result.agent.name}</div>
              <div className="reveal-desc">{result.agent.desc}</div>
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

  const q = QUESTIONS[currentQ]

  return (
    <div className="quiz-screen">
      <div className="quiz-progress">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`quiz-dot ${i < currentQ ? 'quiz-dot-done' : i === currentQ ? 'quiz-dot-active' : ''}`} />
        ))}
      </div>

      <div className={`quiz-card ${flipping ? 'quiz-card-flip' : ''}`}>
        <div className="quiz-card-inner">
          <div className="quiz-question-num">Q{currentQ + 1}/{QUESTIONS.length}</div>
          <div className="quiz-question">{q.question}</div>
          <div className="quiz-options">
            <button className="quiz-option" onClick={() => handleAnswer(q.a.dim)}>
              <span className="quiz-option-key">A</span>
              <span>{q.a.text}</span>
            </button>
            <button className="quiz-option" onClick={() => handleAnswer(q.b.dim)}>
              <span className="quiz-option-key">B</span>
              <span>{q.b.text}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
