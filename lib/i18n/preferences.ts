export type Preferences = { language: 'en' | 'es' }
export const defaults: Preferences = { language: 'en' }
export const cookieNames = { language: 'finance-language' } as const
export function validatePreferences(language?: string): Preferences {
  return {
    language: language === 'es' ? 'es' : 'en',
  }
}
