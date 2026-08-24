import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedManualStatus } from '../services/applicationEventService.js'

test('only post-application outcomes can be manually tracked', () => {
  assert.equal(allowedManualStatus('INTERVIEW'), true)
  assert.equal(allowedManualStatus('OFFER'), true)
  assert.equal(allowedManualStatus('APPLIED'), false)
  assert.equal(allowedManualStatus('APPROVED'), false)
})
