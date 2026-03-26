import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TokenProvider } from './contexts/TokenContext'
import { MailProvider } from './contexts/MailContext'
import { GameProvider } from './contexts/GameContext'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'

const PersonaQuiz = lazy(() => import('./pages/PersonaQuiz').then((m) => ({ default: m.PersonaQuiz })))
const TownMap = lazy(() => import('./pages/TownMap').then((m) => ({ default: m.TownMap })))
const StampBook = lazy(() => import('./pages/StampBook').then((m) => ({ default: m.StampBook })))
const PixelHome = lazy(() => import('./pages/PixelHome').then((m) => ({ default: m.PixelHome })))

function RouteFallback() {
  return (
    <div className="route-fallback" aria-hidden>
      <span className="route-fallback-dot" />
    </div>
  )
}

function AppRoutes() {
  const { loggedIn, agentName, login, logout, setAgentName } = useAuth()
  const needsQuiz = loggedIn && !agentName

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={loggedIn ? <Navigate to={needsQuiz ? '/quiz' : '/town'} replace /> : <Landing />} />
        <Route
          path="/login"
          element={loggedIn ? <Navigate to={needsQuiz ? '/quiz' : '/town'} replace /> : <Login onLogin={login} />}
        />
        <Route
          path="/quiz"
          element={
            !loggedIn ? (
              <Navigate to="/login" replace />
            ) : agentName ? (
              <Navigate to="/town" replace />
            ) : (
              <PersonaQuiz onComplete={setAgentName} />
            )
          }
        />
        <Route
          path="/town"
          element={
            !loggedIn ? <Navigate to="/login" replace /> : needsQuiz ? <Navigate to="/quiz" replace /> : <TownMap onLogout={logout} />
          }
        />
        <Route
          path="/stamp-book"
          element={!loggedIn ? <Navigate to="/login" replace /> : needsQuiz ? <Navigate to="/quiz" replace /> : <StampBook />}
        />
        <Route
          path="/pixel-home"
          element={!loggedIn ? <Navigate to="/login" replace /> : needsQuiz ? <Navigate to="/quiz" replace /> : <PixelHome />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <GameProvider>
          <MailProvider>
            <AppRoutes />
          </MailProvider>
        </GameProvider>
      </TokenProvider>
    </AuthProvider>
  )
}
