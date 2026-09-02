import crypto from 'node:crypto'
import GmailConnection from '../models/GmailConnection.js'
import GmailOAuthAttempt from '../models/GmailOAuthAttempt.js'
import { decryptToken, encryptToken } from './tokenEncryptionService.js'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

function oauthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID; const clientSecret = process.env.GOOGLE_CLIENT_SECRET; const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) throw Object.assign(new Error('Google OAuth credentials are not configured'), { statusCode: 503 })
  let parsedRedirect
  try { parsedRedirect = new URL(redirectUri) } catch { throw Object.assign(new Error('GOOGLE_REDIRECT_URI must be a valid absolute URL'), { statusCode: 503 }) }
  if (!parsedRedirect.pathname.endsWith('/api/email/google/callback')) throw Object.assign(new Error('GOOGLE_REDIRECT_URI must end with /api/email/google/callback'), { statusCode: 503 })
  if (process.env.NODE_ENV === 'production' && ['localhost', '127.0.0.1'].includes(parsedRedirect.hostname)) throw Object.assign(new Error('GOOGLE_REDIRECT_URI cannot use localhost in production'), { statusCode: 503 })
  return { clientId, clientSecret, redirectUri }
}

const stateHash = (state) => crypto.createHash('sha256').update(String(state)).digest('base64url')

export async function startOAuthAttempt(userId, clientUrl) {
  const state = crypto.randomBytes(32).toString('base64url')
  await GmailOAuthAttempt.deleteMany({ userId, status: 'AWAITING_CALLBACK' })
  await GmailOAuthAttempt.create({ userId, stateHash: stateHash(state), clientUrl, expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
  return { state, url: googleAuthorizationUrl(state) }
}

export async function recordOAuthCallback(state, code) {
  if (!state || !code) throw Object.assign(new Error('Invalid Google OAuth callback'), { statusCode: 400 })
  const attempt = await GmailOAuthAttempt.findOneAndUpdate(
    { stateHash: stateHash(state), status: 'AWAITING_CALLBACK', expiresAt: { $gt: new Date() } },
    { $set: { encryptedCode: encryptToken(code), status: 'CALLBACK_RECEIVED' } },
    { returnDocument: 'after' },
  )
  if (!attempt) throw Object.assign(new Error('Google OAuth attempt is invalid, expired, or already used'), { statusCode: 400 })
  return attempt
}

export async function completeOAuthAttempt(attemptId, userId) {
  const attempt = await GmailOAuthAttempt.findOneAndUpdate(
    { _id: attemptId, userId, status: 'CALLBACK_RECEIVED', expiresAt: { $gt: new Date() } },
    { $set: { status: 'EXCHANGING' } },
    { returnDocument: 'after' },
  )
  if (!attempt) throw Object.assign(new Error('Google OAuth attempt is invalid, expired, already used, or belongs to another account'), { statusCode: 400 })
  try {
    const connection = await exchangeCode(userId, decryptToken(attempt.encryptedCode))
    await GmailOAuthAttempt.deleteOne({ _id: attempt._id })
    return connection
  } catch (error) {
    await GmailOAuthAttempt.updateOne({ _id: attempt._id, status: 'EXCHANGING' }, { $set: { status: 'CALLBACK_RECEIVED' } }).catch(() => {})
    throw error
  }
}

export function googleAuthorizationUrl(state) {
  const { clientId, redirectUri } = oauthConfig()
  return `${GOOGLE_AUTH_URL}?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'https://www.googleapis.com/auth/gmail.send', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state })}`
}

async function tokenRequest(params) {
  const response = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) })
  const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error_description || 'Google token exchange failed'), { statusCode: 502, oauthError: data.error }); return data
}

export async function exchangeCode(userId, code) {
  const { clientId, clientSecret, redirectUri } = oauthConfig()
  const data = await tokenRequest({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  const existing = await GmailConnection.findOne({ userId })
  return GmailConnection.findOneAndUpdate({ userId }, { $set: { encryptedAccessToken: encryptToken(data.access_token), encryptedRefreshToken: data.refresh_token ? encryptToken(data.refresh_token) : existing?.encryptedRefreshToken, tokenExpiry: new Date(Date.now() + Number(data.expires_in || 3600) * 1000), scope: data.scope, connectedAt: new Date() }, $setOnInsert: { userId } }, { upsert: true, returnDocument: 'after', runValidators: true })
}

async function accessToken(connection) {
  if (connection.tokenExpiry && connection.tokenExpiry.getTime() > Date.now() + 60000) return decryptToken(connection.encryptedAccessToken)
  const refreshToken = decryptToken(connection.encryptedRefreshToken)
  if (!refreshToken) throw Object.assign(new Error('Reconnect Gmail to continue'), { statusCode: 409 })
  const { clientId, clientSecret } = oauthConfig()
  let data
  try {
    data = await tokenRequest({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' })
  } catch (error) {
    if (error.oauthError === 'invalid_grant') {
      await GmailConnection.deleteOne({ _id: connection._id })
      throw Object.assign(new Error('Gmail authorization expired or was revoked. Reconnect Gmail to continue.'), { statusCode: 409 })
    }
    throw error
  }
  connection.encryptedAccessToken = encryptToken(data.access_token); connection.tokenExpiry = new Date(Date.now() + Number(data.expires_in || 3600) * 1000); await connection.save()
  return data.access_token
}

const base64url = (value) => Buffer.from(value).toString('base64url')
export function createMimeMessage({ to, subject, body, pdf, filename }) {
  const boundary = `remote-ready-${crypto.randomBytes(12).toString('hex')}`
  const safeSubject = String(subject).replace(/[\r\n]+/g, ' ')
  const safeFilename = String(filename).replace(/["\r\n]/g, '')
  const lines = [`To: ${to}`, `Subject: =?UTF-8?B?${Buffer.from(safeSubject).toString('base64')}?=`, 'MIME-Version: 1.0', `Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '', Buffer.from(body).toString('base64'), `--${boundary}`, `Content-Type: application/pdf; name="${safeFilename}"`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${safeFilename}"`, '', pdf.toString('base64'), `--${boundary}--`, '']
  return base64url(lines.join('\r\n'))
}

export async function sendGmailMessage(userId, raw) {
  const connection = await GmailConnection.findOne({ userId })
  if (!connection) throw Object.assign(new Error('Connect Gmail before sending'), { statusCode: 409 })
  const token = await accessToken(connection)
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw }) })
  const data = await response.json()
  if (response.status === 401) {
    await GmailConnection.deleteOne({ _id: connection._id })
    throw Object.assign(new Error('Gmail authorization expired or was revoked. Reconnect Gmail to continue.'), { statusCode: 409 })
  }
  if (!response.ok) throw Object.assign(new Error(data.error?.message || 'Gmail could not send this application'), { statusCode: 502 })
  return data
}
