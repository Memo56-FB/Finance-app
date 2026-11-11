import { cookies } from 'next/headers'
import { cookieNames, validatePreferences } from './preferences'
import { createI18n } from './index'
export async function getI18n() {
  const jar = await cookies()
  return createI18n(validatePreferences(jar.get(cookieNames.language)?.value))
}
