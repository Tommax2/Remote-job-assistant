const unique = (values = []) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()))]
const normalized = (value = '') => String(value).toLowerCase()

function relevantFirst(items, jobText, fields) {
  const jobWords = new Set(normalized(jobText).split(/[^a-z0-9+#.]+/).filter((word) => word.length > 2))
  const score = (item) => fields.reduce((total, field) => total + normalized(item?.[field]).split(/[^a-z0-9+#.]+/).filter((word) => jobWords.has(word)).length, 0)
  return [...(items || [])].sort((a, b) => score(b) - score(a))
}

export function deterministicTailor(profile, master, job) {
  const jobText = `${job.title} ${job.description}`
  const skills = unique([...(profile.skills || []), ...(master.skills || [])])
  const relevant = skills.filter((skill) => normalized(jobText).includes(normalized(skill)))
  const baseTitle = profile.professionalTitle || master.professionalTitle || 'Professional'
  const baseSummary = master.professionalSummary || profile.professionalSummary || ''
  const years = Number(profile.yearsOfExperience) || 0
  const skillStatement = relevant.length ? `Verified strengths relevant to this role include ${relevant.slice(0, 6).join(', ')}.` : ''
  const experienceStatement = years ? `Brings ${years}+ years of professional experience.` : ''
  const targetStatement = `Targeting the ${job.title} role${job.company ? ` at ${job.company}` : ''}.`
  const tailoredSummary = unique([targetStatement, experienceStatement, skillStatement, baseSummary]).join(' ')
  const tailoredTitle = normalized(baseTitle) === normalized(job.title) ? baseTitle : `${baseTitle} | ${job.title}`
  return { professionalTitle: tailoredTitle, professionalSummary: tailoredSummary, skills: unique([...relevant, ...skills]), experience: relevantFirst(master.experience?.length ? master.experience : profile.experience, jobText, ['jobTitle', 'company', 'description']), education: master.education?.length ? master.education : profile.education, projects: relevantFirst(master.projects?.length ? master.projects : profile.projects, jobText, ['name', 'description']), generationMode: 'RELEVANCE_ORDERING' }
}

export async function tailorResume(profile, master, job) {
  const fallback = deterministicTailor(profile, master, job)
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.AI_API
  if (!apiKey) return fallback
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite'
  const payload = { candidate: { profile, masterResume: { professionalTitle: master.professionalTitle, professionalSummary: master.professionalSummary, skills: master.skills, experience: master.experience, education: master.education, projects: master.projects } }, job: { title: job.title, company: job.company, description: job.description } }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(30000), headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: 'Create a visibly job-specific resume using only supplied candidate facts. Rewrite the professional summary for the target role, lead with verified matching skills, reorder relevant experience and projects, and improve bullet wording with job-description terminology only when it preserves the original meaning. Never invent or alter employers, dates, qualifications, skills, achievements, responsibilities, or metrics. Do not copy the master resume unchanged. Return JSON with professionalTitle, professionalSummary, skills, experience, education, projects.' }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload).slice(0, 90000) }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Resume tailoring is temporarily unavailable')
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}')
    const allowedSkills = new Map(unique([...(profile.skills || []), ...(master.skills || [])]).map((skill) => [normalized(skill), skill]))
    return { professionalTitle: parsed.professionalTitle || fallback.professionalTitle, professionalSummary: parsed.professionalSummary || fallback.professionalSummary, skills: unique(parsed.skills || []).map((skill) => allowedSkills.get(normalized(skill))).filter(Boolean), experience: Array.isArray(parsed.experience) ? parsed.experience : fallback.experience, education: Array.isArray(parsed.education) ? parsed.education : fallback.education, projects: Array.isArray(parsed.projects) ? parsed.projects : fallback.projects, generationMode: 'GEMINI' }
  } catch (error) {
    console.warn(`Gemini resume tailoring unavailable; using relevance ordering (${error.code || error.name || 'error'})`)
    return fallback
  }
}
