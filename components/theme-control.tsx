'use client'

import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { resolveTheme, THEME_KEY, validTheme, type Theme } from '@/lib/theme'

let unavailableStorageTheme: Theme = 'system'
function snapshot(): Theme {
  try { return validTheme(localStorage.getItem(THEME_KEY)) } catch { return unavailableStorageTheme }
}
function applyTheme() {
  const theme = resolveTheme(snapshot(), matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
function persistTheme(value: Theme) {
  try { localStorage.setItem(THEME_KEY, value) } catch { unavailableStorageTheme = value }
  window.dispatchEvent(new Event('theme-change'))
}
function subscribe(callback: () => void) {
  const media = matchMedia('(prefers-color-scheme: dark)')
  const update = () => { applyTheme(); callback() }
  media.addEventListener('change', update)
  window.addEventListener('storage', update)
  window.addEventListener('theme-change', update)
  return () => {
    media.removeEventListener('change', update)
    window.removeEventListener('storage', update)
    window.removeEventListener('theme-change', update)
  }
}

export function ThemeControl() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'system' as const)
  return <div className="theme-control" role="group" aria-label="Apariencia">
    {([{ value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Oscuro', icon: Moon }, { value: 'system', label: 'Sistema', icon: Monitor }] as const).map(({ value, label, icon: Icon }) =>
      <button key={value} type="button" aria-label={label} title={label} aria-pressed={theme === value} onClick={() => persistTheme(value)}><Icon size={17} aria-hidden="true" /></button>
    )}
  </div>
}
