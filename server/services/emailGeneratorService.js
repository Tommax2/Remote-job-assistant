const unique = (values = []) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()))]
const normalized = (value = '') => String(value).toLowerCase()

export function createTemplateEmail(profile, resume, job) {
  const relevantSkills = unique(resume.skills || []).filter((skill) => normalized(`${job.title} ${job.description}`).includes(normalized(skill))).slice(0, 5)
  const skillLine = relevantSkills.length ? `My background includes ${relevantSkills.join(', ')}, which align${relevantSkills.length === 1 ? 's' : ''} with the needs described for this position.` : `My experience and projects align with the responsibilities described for this position.`
  const summary = String(resume.professionalSummary || profile.professionalSummary || '').trim()
  const body = [`Dear Hiring Manager,`, `I am writing to apply for the ${job.title} position at ${job.company}. ${skillLine}`, summary ? `${summary}` : '', `I have attached my tailored CV for your consideration. I would welcome the opportunity to discuss how my verified experience could contribute to ${job.company}.`, `Kind regards,\n${profile.fullName}\n${profile.email}${profile.phone ? `\n${profile.phone}` : ''}`].filter(Boolean).join('\n\n')
  return { subject: `Application for ${job.title} — ${profile.fullName}`, body, generationMode: 'TEMPLATE' }
}

export async function generateApplicationEmail(profile, resume, job) {
  const fallback = createTemplateEmail(profile, resume, job)
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.AI_API
  if (!apiKey) return fallback
  try {
    const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite'
    const payload = { candidate: { fullName: profile.fullName, professionalTitle: resume.professionalTitle, summary: resume.professionalSummary, skills: resume.skills, experience: resume.experience, projects: resume.projects }, job: { title: job.title, company: job.company, description: job.description } }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(30000), headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: 'Write a concise, specific job application email using only supplied candidate facts. Never invent experience, skills, achievements, qualifications, or metrics. Mention two or three verified points relevant to the role, use a professional natural tone, and do not claim the candidate is a perfect fit. Return JSON with subject and body.' }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload).slice(0, 90000) }] }], generationConfig: { temperature: 0.35, responseMimeType: 'application/json' } }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini email generation is unavailable')
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}')
    if (!parsed.subject?.trim() || !parsed.body?.trim()) throw new Error('Gemini returned an incomplete email')
    return { subject: parsed.subject.trim(), body: parsed.body.trim(), generationMode: 'GEMINI' }
  } catch (error) {
    console.warn(`Gemini email generation unavailable; using template (${error.code || error.name || 'error'})`)
    return fallback
  }
}
