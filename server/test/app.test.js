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
