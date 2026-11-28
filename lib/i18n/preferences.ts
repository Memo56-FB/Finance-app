export type Preferences = { language: 'en' | 'es' }
export const defaults: Preferences = { language: 'en' }
export const themes = ['light', 'dark'] as const
export type Theme = (typeof themes)[number]
export const defaultTheme: Theme = 'dark'
export const cookieNames = { language: 'finance-language', theme: 'finance-theme' } as const
export function validatePreferences(language?: string): Preferences {
  return {
    language: language === 'es' ? 'es' : 'en',
  }
}
export function validateTheme(theme?: string): Theme {
  return themes.find(candidate => candidate === theme) ?? defaultTheme
}
