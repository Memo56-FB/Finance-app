import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
const sessions = new Map()
const users = new Map([['first@example.test', 'test-password-123'], ['second@example.test', 'test-password-123']])
const server = createServer(async (req,res) => {
  const action = req.url
  const id = /(?:^|;\s*)JSESSIONID=([^;]+)/.exec(req.headers.cookie ?? '')?.[1]
  let session = sessions.get(id)
  function send(status, data) {
    res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'})
    res.end(data === undefined ? '' : JSON.stringify(data))
  }
  function cookie(value, expired = false) { res.setHeader('Set-Cookie', 'JSESSIONID=' + value + '; Path=/; HttpOnly; SameSite=Lax' + (expired ? '; Max-Age=0' : '')) }
  if (action === '/__health') return send(200,{ok:true})
  if (action === '/__expire') { sessions.delete(id); return send(204) }
  if (id === 'unavailable') return send(503)
  if (action === '/api/auth/csrf' && req.method === 'GET') {
    if (!session) {
      const key = randomUUID(); session = { token:randomUUID() }; sessions.set(key,session); cookie(key)
    }
    return send(200,{token:session.token,headerName:'X-CSRF-TOKEN',parameterName:'_csrf'})
  }
  if (action === '/api/auth/me') return session?.email ? send(200,{email:session.email}) : send(401)
  let body = ''
  for await (const chunk of req) body += chunk
  if (!session || req.headers['x-csrf-token'] !== session.token) return send(403)
  if (action === '/api/auth/register') {
    let data
    try { data = JSON.parse(body) } catch { return send(400,{errors:[]}) }
    const email = data.email.trim().toLowerCase()
    if (!data.name.trim() || data.password.length < 8 || Buffer.byteLength(data.password) > 72) return send(400,{errors:[{field:'password',message:'Invalid'}]})
    if (users.has(email)) return send(409,{status:409})
    users.set(email,data.password)
    return send(201,{name:data.name.trim(),email})
  }
  if (action === '/api/auth/login') {
    const data = new URLSearchParams(body), email = data.get('email')?.trim().toLowerCase()
    if (!users.has(email) || users.get(email) !== data.get('password')) return send(401)
    sessions.delete(id)
    const key=randomUUID();sessions.set(key,{email,token:randomUUID()});cookie(key)
    return send(204)
  }
  if (action === '/api/auth/logout') { sessions.delete(id);cookie('',true);return send(204) }
  send(404)
})
server.listen(Number(process.env.FINANCE_TEST_API_PORT ?? 3101), '127.0.0.1')
