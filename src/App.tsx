import { useAuth } from './lib/auth'
import Login from './screens/Login'

export default function App() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Login />
  return <h1 className="p-6 text-4xl">Tônus</h1>
}
