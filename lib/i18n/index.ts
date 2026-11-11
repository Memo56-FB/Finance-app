import { en, type Messages } from './messages/en'
import { es } from './messages/es'
import { createFormatters } from './format'
import type { Preferences } from './preferences'
export function createI18n(preferences: Preferences, messages: Messages = preferences.language === 'es' ? es : en) {
  return { ...preferences, ...createFormatters(preferences), messages, t: (key: keyof Messages) => messages[key] }
}
export { en, es }
export type { Messages }
