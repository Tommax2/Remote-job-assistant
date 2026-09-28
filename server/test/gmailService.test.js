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

// These checks mock Google and database access; no messages are delivered.
test('renews a rejected access token and retries the send once', async (t) => {
  const { default: GmailConnection } = await import('../models/GmailConnection.js')
  const { encryptToken } = await import('../services/tokenEncryptionService.js')
  const { sendGmailMessage } = await import('../services/gmailService.js')
  const oldKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  const oldId = process.env.GOOGLE_CLIENT_ID
  const oldSecret = process.env.GOOGLE_CLIENT_SECRET
  const oldRedirect = process.env.GOOGLE_REDIRECT_URI
  Object.assign(process.env, { GOOGLE_TOKEN_ENCRYPTION_KEY: 'test-only-key', GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret', GOOGLE_REDIRECT_URI: 'https://example.com/api/email/google/callback' })
  t.after(() => {
    for (const [key, value] of Object.entries({ GOOGLE_TOKEN_ENCRYPTION_KEY: oldKey, GOOGLE_CLIENT_ID: oldId, GOOGLE_CLIENT_SECRET: oldSecret, GOOGLE_REDIRECT_URI: oldRedirect })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  const save = t.mock.fn(async () => {})
  t.mock.method(GmailConnection, 'findOne', async () => ({ _id: 'connection', encryptedAccessToken: encryptToken('old-access'), encryptedRefreshToken: encryptToken('refresh'), tokenExpiry: new Date(Date.now() + 3600000), save }))
  const remove = t.mock.method(GmailConnection, 'deleteOne', async () => {})
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options })
    if (requests.length === 1) return new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), { status: 401 })
    if (requests.length === 2) return new Response(JSON.stringify({ access_token: 'new-access', expires_in: 3600 }))
    return new Response(JSON.stringify({ id: 'sent-message' }))
  })
  assert.deepEqual(await sendGmailMessage('user', 'mime-message'), { id: 'sent-message' })
  assert.equal(requests.length, 3)
  assert.equal(requests[1].url, 'https://oauth2.googleapis.com/token')
  assert.equal(requests[1].options.body.get('grant_type'), 'refresh_token')
  assert.equal(requests[2].options.headers.Authorization, 'Bearer new-access')
  assert.equal(save.mock.callCount(), 1)
  assert.equal(remove.mock.callCount(), 0)
})

test('does not retry an ambiguous network failure while sending', async (t) => {
  const { default: GmailConnection } = await import('../models/GmailConnection.js')
  const { encryptToken } = await import('../services/tokenEncryptionService.js')
  const { sendGmailMessage } = await import('../services/gmailService.js')
  const oldKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = 'test-only-key'
  t.after(() => { if (oldKey === undefined) delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY; else process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = oldKey })
  t.mock.method(GmailConnection, 'findOne', async () => ({ encryptedAccessToken: encryptToken('access'), tokenExpiry: new Date(Date.now() + 3600000) }))
  const request = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed') })
  await assert.rejects(sendGmailMessage('user', 'mime-message'), /fetch failed/)
  assert.equal(request.mock.callCount(), 1)
})
