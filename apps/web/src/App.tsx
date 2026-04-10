import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TokenProvider } from './contexts/TokenContext'
import { MailProvider } from './contexts/MailContext'
import { GameProvider } from './contexts/GameContext'

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
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/town" replace />} />
        <Route path="/town" element={<TownMap onLogout={() => {}} />} />
        <Route path="/stamp-book" element={<StampBook />} />
        <Route path="/pixel-home" element={<PixelHome />} />
        <Route path="*" element={<Navigate to="/town" replace />} />
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
