// Tema claro por padrão; escuro é opção da pessoa (guardada no aparelho).
export type Theme = 'light' | 'dark'

const KEY = 'tonus-theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f0e15' : '#f3f2ec')
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // sem armazenamento: o tema vale só nesta abertura
  }
  applyTheme(theme)
}
