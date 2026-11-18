import type { NextRequest } from 'next/server'

export async function bodyText(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > 8192) throw new Error('Body too large')
  const reader = request.body?.getReader()
  if (!reader) return ''
  let size = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 8192) { await reader.cancel(); throw new Error('Body too large') }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
