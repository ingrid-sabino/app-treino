import { useState } from 'react'
import { signOut, useAuth } from '../lib/auth'
import { getTheme, setTheme, type Theme } from '../lib/theme'
import ProfileView from './ProfileView'

export default function Profile() {
  const { session } = useAuth()
  const [theme, setThemeState] = useState<Theme>(getTheme())
  return (
    <ProfileView
      email={session?.user.email ?? ''}
      theme={theme}
      onThemeChange={(t) => {
        setTheme(t)
        setThemeState(t)
      }}
      onSignOut={signOut}
    />
  )
}
