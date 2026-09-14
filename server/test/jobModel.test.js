import test from 'node:test'
import assert from 'node:assert/strict'
import Job, { JOB_RETENTION_SECONDS } from '../models/Job.js'

test('jobs expire 20 days after their published date', () => {
  const ttlIndex = Job.schema.indexes().find(([fields]) => fields.publishedAt === 1)

  assert.ok(ttlIndex, 'publishedAt TTL index is missing')
  assert.equal(ttlIndex[1].expireAfterSeconds, JOB_RETENTION_SECONDS)
  assert.equal(JOB_RETENTION_SECONDS, 20 * 24 * 60 * 60)
})
