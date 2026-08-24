import test from 'node:test'
import assert from 'node:assert/strict'
import { extractApplicationEmail } from '../services/jobEmailService.js'

test('extracts application email from mailto links and application instructions', () => {
  assert.equal(extractApplicationEmail('mailto:jobs@example.com?subject=Developer'), 'jobs@example.com')
  assert.equal(extractApplicationEmail('Send your CV and application to careers@example.org.'), 'careers@example.org')
})

test('does not use unrelated support addresses as application recipients', () => {
  assert.equal(extractApplicationEmail('Questions? Contact support@example.com for technical help.'), '')
})
