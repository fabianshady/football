export type Theme = 'light' | 'dark' | 'system'
export const THEME_KEY = 'itj-theme'
export function validTheme(value: unknown): Theme { return value === 'light' || value === 'dark' ? value : 'system' }
export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' { return theme === 'system' ? prefersDark ? 'dark' : 'light' : theme }
/** Runs before body paint; storage can be unavailable in private/restricted contexts. */
export const themeScript = `(()=>{let t='system';try{const s=localStorage.getItem('${THEME_KEY}');if(s==='light'||s==='dark')t=s}catch{}const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'})()`
