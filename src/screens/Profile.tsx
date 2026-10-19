import { Card, TextButton } from '../components/ui'
import Screen from '../components/Screen'
import { signOut, useAuth } from '../lib/auth'

export default function Profile() {
  const { session } = useAuth()
  return (
    <Screen title="Perfil">
      <Card>
        <p className="text-sm font-medium text-muted">Conta</p>
        <p className="mt-1 break-all">{session?.user.email}</p>
        <TextButton className="mt-4" onClick={signOut}>
          Sair
        </TextButton>
      </Card>
    </Screen>
  )
}
