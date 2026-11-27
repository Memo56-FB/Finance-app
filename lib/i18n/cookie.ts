import { cookieNames, themes } from './preferences'

const allowedValues: Record<keyof typeof cookieNames, readonly string[]> = {
  language: ['en', 'es'],
  theme: themes,
}

export function savePreference(
  doc: Pick<Document, 'cookie'>,
  value: string,
  secure: boolean,
  preference: keyof typeof cookieNames = 'language',
) {
  if (!allowedValues[preference].includes(value)) throw new Error('Unsupported preference')
  const name = cookieNames[preference]
  doc.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=31536000${secure ? '; Secure' : ''}`
  if (!doc.cookie.split(';').some(part => part.trim() === `${name}=${value}`)) throw new Error('Cookie rejected')
}
