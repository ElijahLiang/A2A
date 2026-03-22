import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { PersonaQuiz } from './pages/PersonaQuiz'
import { TownMap } from './pages/TownMap'

const AUTH_KEY = 'a2a-town-auth'
const AGENT_KEY = 'a2a-my-agent'

export function App() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(AUTH_KEY) === '1')
  const [myAgent, setMyAgent] = useState(() => localStorage.getItem(AGENT_KEY) || '')

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, loggedIn ? '1' : '')
  }, [loggedIn])

  useEffect(() => {
    localStorage.setItem(AGENT_KEY, myAgent)
  }, [myAgent])

  const handleLogout = () => {
    setLoggedIn(false)
    setMyAgent('')
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AGENT_KEY)
  }

  const needsQuiz = loggedIn && !myAgent

  return (
    <Routes>
      <Route path="/" element={loggedIn ? <Navigate to={needsQuiz ? '/quiz' : '/town'} replace /> : <Landing />} />
      <Route path="/login" element={loggedIn ? <Navigate to={needsQuiz ? '/quiz' : '/town'} replace /> : <Login onLogin={() => setLoggedIn(true)} />} />
      <Route path="/quiz" element={
        !loggedIn ? <Navigate to="/login" replace /> :
        myAgent ? <Navigate to="/town" replace /> :
        <PersonaQuiz onComplete={(name) => setMyAgent(name)} />
      } />
      <Route path="/town" element={
        !loggedIn ? <Navigate to="/login" replace /> :
        needsQuiz ? <Navigate to="/quiz" replace /> :
        <TownMap onLogout={handleLogout} />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
