import test from 'node:test'
import assert from 'node:assert/strict'
import Job from '../models/Job.js'
import { deleteExpiredJobs, startJobCleanup } from '../services/jobRetentionService.js'
import { syncRemotiveJobs } from '../services/jobService.js'

test('cleanup deletes jobs at the 20-day posting cutoff, regardless of last seen date', async (t) => {
  const remove = t.mock.method(Job, 'deleteMany', async () => ({ deletedCount: 2 }))
  const result = await deleteExpiredJobs(Date.parse('2026-09-30T12:00:00Z'))
  assert.deepEqual(remove.mock.calls[0].arguments[0], { publishedAt: { $lte: new Date('2026-09-10T12:00:00Z') } })
  assert.equal(result.deletedCount, 2)
})

test('cleanup runs immediately and schedules recurring deletion', async (t) => {
  const remove = t.mock.method(Job, 'deleteMany', async () => ({ deletedCount: 0 }))
  let tick
  let unreferenced = false
  t.mock.method(globalThis, 'setInterval', (callback, delay) => {
    tick = callback
    assert.equal(delay, 3600000)
    return { unref() { unreferenced = true } }
  })
  await startJobCleanup()
  assert.equal(remove.mock.callCount(), 1)
  await tick()
  assert.equal(remove.mock.callCount(), 2)
  assert.equal(unreferenced, true)
})

test('refresh skips expired and invalid dates while importing recent jobs', async (t) => {
  const now = Date.parse('2026-09-30T12:00:00Z')
  t.mock.method(Date, 'now', () => now)
  const base = { title: 'Engineer', company_name: 'Acme', url: 'https://example.com/job', description: 'Build products' }
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ jobs: [
    { ...base, id: 1, publication_date: '2026-09-10T11:59:59Z' },
    { ...base, id: 2, publication_date: '2026-09-10T12:00:00Z' },
    { ...base, id: 3, publication_date: '2026-09-10T12:00:01Z' },
    { ...base, id: 4, publication_date: 'invalid' },
  ] }) }))
  const write = t.mock.method(Job, 'bulkWrite', async () => ({ upsertedCount: 1, modifiedCount: 0 }))
  await syncRemotiveJobs()
  const operations = write.mock.calls[0].arguments[0]
  assert.equal(operations.length, 1)
  assert.equal(operations[0].updateOne.filter.externalId, '3')
})
