import { NavLink } from 'react-router'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
}

const tabs = [
  {
    to: '/',
    label: 'Hoje',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
        <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    to: '/treinar',
    label: 'Treinar',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
        <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
      </svg>
    ),
  },
  {
    to: '/evolucao',
    label: 'Evolução',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
        <path d="M3.5 18.5 9 13l4 3.5 7.5-8.5" />
        <path d="M15.5 8h5v5" />
      </svg>
    ),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
      </svg>
    ),
  },
]

export default function TabBar() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-ink' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Aba ativa: barra lima no topo */}
                  <span className={`absolute inset-x-3 top-0 h-1 ${isActive ? 'bg-lime' : ''}`} />
                  {tab.icon}
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
