import { useMemo, useState } from 'react'
import Node_108_2 from './components/Node_108_2'
import Node_129_689 from './components/Node_129_689'
import Node_129_2 from './components/Node_129_2'
import Node_129_1351 from './components/Node_129_1351'
import Node_129_1526 from './components/Node_129_1526'
import Node_129_1795 from './components/Node_129_1795'
import Node_129_3674 from './components/Node_129_3674'

type ScreenDef = {
  id: string
  title: string
  render: () => JSX.Element
}

const screens: ScreenDef[] = [
  { id: '108:2', title: 'Node 108:2 (108:2)', render: Node_108_2 },
  { id: '129:689', title: 'Node 129:689 (129:689)', render: Node_129_689 },
  { id: '129:2', title: 'Node 129:2 (129:2)', render: Node_129_2 },
  { id: '129:1351', title: 'Node 129:1351 (129:1351)', render: Node_129_1351 },
  { id: '129:1526', title: 'Node 129:1526 (129:1526)', render: Node_129_1526 },
  { id: '129:1795', title: 'Node 129:1795 (129:1795)', render: Node_129_1795 },
  { id: '129:3674', title: 'Node 129:3674 (129:3674)', render: Node_129_3674 },
]

export default function IntegratedFigmaScreens() {
  const [activeId, setActiveId] = useState(screens[0]?.id ?? '')
  const active = useMemo(() => screens.find((s) => s.id === activeId) ?? screens[0], [activeId])
  const Active = active.render

  return (
    <div style={{ minHeight: '100vh', background: '#101314', color: '#ecf4f3' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#162022', borderBottom: '1px solid #2b3c40', padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => setActiveId(screen.id)}
              style={{
                cursor: 'pointer',
                border: '1px solid #4a6970',
                padding: '6px 10px',
                background: screen.id === active.id ? '#2f9d8f' : '#233236',
                color: '#fff',
                fontSize: 12,
              }}
            >
              {screen.title}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <Active />
      </div>
    </div>
  )
}
