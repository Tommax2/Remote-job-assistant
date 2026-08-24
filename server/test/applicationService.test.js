import test from 'node:test'
import assert from 'node:assert/strict'
import { validateApplicationForApproval } from '../services/applicationService.js'

test('approval requires a tailored CV and complete email', () => {
  assert.equal(validateApplicationForApproval({ status: 'READY_FOR_REVIEW', emailSubject: '', emailBody: 'Body' }, { type: 'TAILORED' }), 'Email subject is required before approval')
  assert.equal(validateApplicationForApproval({ status: 'READY_FOR_REVIEW', emailSubject: 'Subject', emailBody: 'Body' }, { type: 'MASTER' }), 'A tailored CV is required before approval')
  assert.equal(validateApplicationForApproval({ status: 'READY_FOR_REVIEW', emailSubject: 'Subject', emailBody: 'Body' }, { type: 'TAILORED' }), null)
})
