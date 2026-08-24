const emailPattern = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi
const applicationWords = /apply|application|send|submit|resume|résumé|cv|candidate|hiring|recruit/i
const unsuitable = /^(?:no-?reply|privacy|support|help|info)@/i

export function extractApplicationEmail(...values) {
  const content = values.filter(Boolean).join(' ')
  const mailto = content.match(/mailto:([^?\s"'<>]+)/i)?.[1]
  if (mailto) { try { const decoded = decodeURIComponent(mailto).match(emailPattern)?.[0]; if (decoded) return decoded.toLowerCase() } catch { /* continue with text extraction */ } }
  for (const match of content.matchAll(emailPattern)) {
    const email = match[0].toLowerCase(); const start = Math.max(0, match.index - 120); const end = Math.min(content.length, match.index + email.length + 120)
    if (!unsuitable.test(email) && applicationWords.test(content.slice(start, end))) return email
  }
  return ''
}
