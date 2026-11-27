export type Preferences = { language: 'en' | 'es' }
export const defaults: Preferences = { language: 'en' }
export const themes = ['overworld', 'nether', 'diamond'] as const
export type Theme = (typeof themes)[number]
export const defaultTheme: Theme = 'overworld'
export const cookieNames = { language: 'finance-language', theme: 'finance-theme' } as const
export function validatePreferences(language?: string): Preferences {
  return {
    language: language === 'es' ? 'es' : 'en',
  }
}
export function validateTheme(theme?: string): Theme {
  return themes.find(candidate => candidate === theme) ?? defaultTheme
}
