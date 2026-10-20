import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import TabBar from './components/TabBar'
import { useAuth } from './lib/auth'
import Login from './screens/Login'
import Profile from './screens/Profile'
import Progress from './screens/Progress'
import Today from './screens/Today'
import Train from './screens/Train'
import DesignSheet from './screens/DesignSheet'

export default function App() {
  const { session, loading } = useAuth()
  // Folha de componentes para revisar a identidade visual; não vai para produção
  if (import.meta.env.DEV && window.location.pathname === '/design') return <DesignSheet />
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
