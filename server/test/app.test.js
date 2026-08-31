import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../app.js'

test('health endpoint reports ok', async (t) => {
  const server = createApp().listen(0)
  t.after(() => server.close())
  const { port } = server.address()
  const response = await fetch(`http://127.0.0.1:${port}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-powered-by'), null)
})

test('production frontend can complete an API preflight request', async (t) => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
  })

  const server = createApp().listen(0)
  t.after(() => server.close())
  const { port } = server.address()
  const origin = 'https://remote-job-assistant-ba96-git-main-tommys-projects-b8fc9b54.vercel.app'
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/sync`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  assert.match(response.headers.get('access-control-allow-methods'), /POST/)
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/i)
})

test('local frontend can complete a preflight against the production API', async (t) => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
  })

  const server = createApp().listen(0)
  t.after(() => server.close())
  const { port } = server.address()
  const origin = 'http://localhost:5173'
  const response = await fetch(`http://127.0.0.1:${port}/api/onboarding/status`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
})

test('API preflight rejects an unknown production origin', async (t) => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
  })

  const server = createApp().listen(0)
  t.after(() => server.close())
  const { port } = server.address()
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/sync`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://attacker.example',
      'Access-Control-Request-Method': 'POST',
    },
  })

  assert.equal(response.status, 403)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})
