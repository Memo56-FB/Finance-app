import 'server-only'
import { createHash } from 'node:crypto'

// A tag binds a tab to the cookie verified on entry. Only the cookie authenticates requests.
export function sessionTag(session: string) {
  return createHash('sha256').update('finance-session:').update(session).digest('base64url')
}

export function matchesSession(request: Request, session?: string) {
  const expected = request.headers.get('x-finance-session')
  return expected === null || (!!session && expected === sessionTag(session))
}
