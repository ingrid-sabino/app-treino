import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import TabBar from './components/TabBar'
import { useAuth } from './lib/auth'
import Login from './screens/Login'
import Profile from './screens/Profile'
import Progress from './screens/Progress'
import Today from './screens/Today'
import Train from './screens/Train'

// Prévias visuais com dados de exemplo; o import dinâmico some do build de produção
const Preview = import.meta.env.DEV ? lazy(() => import('./screens/Preview')) : null

export default function App() {
  const { session, loading } = useAuth()
  // Folha de componentes para revisar a identidade visual; não vai para produção
  if (Preview && window.location.pathname === '/design')
    return (
      <Suspense>
        <Preview />
      </Suspense>
    )
  if (loading) return null
  if (!session) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/treinar" element={<Train />} />
        <Route path="/evolucao" element={<Progress />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </BrowserRouter>
  )
}
