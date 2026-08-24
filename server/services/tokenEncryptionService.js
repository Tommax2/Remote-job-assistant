import crypto from 'node:crypto'

function key() {
  const configured = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  if (!configured) throw Object.assign(new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not configured'), { statusCode: 503 })
  return crypto.createHash('sha256').update(configured).digest()
}

export function encryptToken(value) {
  if (!value) return ''
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptToken(value) {
  if (!value) return ''
  const [iv, tag, encrypted] = value.split('.'); const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8')
}
