import test from 'node:test'
import assert from 'node:assert/strict'
import { createMimeMessage } from '../services/gmailService.js'

test('creates a Gmail MIME message with recipient, body, and PDF attachment', () => {
  const raw = createMimeMessage({ to: 'hiring@example.com', subject: 'Application for Developer', body: 'Hello hiring team', pdf: Buffer.from('%PDF-test'), filename: 'candidate-cv.pdf' })
  const decoded = Buffer.from(raw, 'base64url').toString('utf8')
  assert.match(decoded, /To: hiring@example\.com/)
  assert.match(decoded, /candidate-cv\.pdf/)
  assert.match(decoded, /JVBERi10ZXN0/)
})
