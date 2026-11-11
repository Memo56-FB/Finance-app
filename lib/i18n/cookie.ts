import { cookieNames } from './preferences'
export function savePreference(doc: Pick<Document, 'cookie'>, value: string, secure: boolean) {
  if (!['en', 'es'].includes(value)) throw new Error('Unsupported preference')
  const name = cookieNames.language
  doc.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=31536000${secure ? '; Secure' : ''}`
  if (!doc.cookie.split(';').some(part => part.trim() === `${name}=${value}`)) throw new Error('Cookie rejected')
}
