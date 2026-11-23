import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { handleFinance } from './finance-api.mjs'
const sessions = new Map()
const users = new Map([['first', 'test-password-123'], ['second', 'test-password-123']])
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
  if (action === '/api/auth/me') return session?.username ? send(200,{username:session.username}) : send(401)
  let body = ''
  for await (const chunk of req) body += chunk
  if (!action.startsWith('/api/auth/')) return handleFinance(req,res,session,body)
  if (!session || req.headers['x-csrf-token'] !== session.token) return send(403)
  if (action === '/api/auth/register') {
    let data
    try { data = JSON.parse(body) } catch { return send(400,{errors:[]}) }
    const username = data.username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{1,254}$/.test(username)) return send(400,{errors:[{field:'username',message:'Invalid'}]})
    if (!data.name.trim() || data.password.length < 8 || Buffer.byteLength(data.password) > 72) return send(400,{errors:[{field:'password',message:'Invalid'}]})
    if (users.has(username)) return send(409,{status:409})
    users.set(username,data.password)
    return send(201,{name:data.name.trim(),username})
  }
  if (action === '/api/auth/login') {
    const data = new URLSearchParams(body), username = data.get('username')?.trim().toLowerCase()
    if (!users.has(username) || users.get(username) !== data.get('password')) return send(401)
    sessions.delete(id)
    const key=randomUUID();sessions.set(key,{username,token:randomUUID()});cookie(key)
    return send(204)
  }
  if (action === '/api/auth/logout') { sessions.delete(id);cookie('',true);return send(204) }
  send(404)
})
server.listen(Number(process.env.FINANCE_TEST_API_PORT ?? 3101), '127.0.0.1')
