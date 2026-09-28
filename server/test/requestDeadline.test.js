import test from 'node:test'
import assert from 'node:assert/strict'
import { withinDeadline } from '../../client/src/services/requestDeadline.js'

test('a stalled authentication task is interrupted by the request deadline', async () => {
  const controller = new AbortController()
  const result = withinDeadline(() => new Promise(() => {}), controller.signal)
  controller.abort(new DOMException('Request timed out', 'TimeoutError'))
  await assert.rejects(result, { name: 'TimeoutError' })
})

test('an expired request does not start the operation', async () => {
  const controller = new AbortController()
  controller.abort(new DOMException('Request timed out', 'TimeoutError'))
  let started = false
  await assert.rejects(withinDeadline(() => { started = true }, controller.signal), { name: 'TimeoutError' })
  assert.equal(started, false)
})

test('successful and failed requests preserve their results', async () => {
  const controller = new AbortController()
  assert.equal(await withinDeadline(async () => 'sent', controller.signal), 'sent')
  await assert.rejects(withinDeadline(async () => { throw new Error('Connection failed') }, controller.signal), /Connection failed/)
})
