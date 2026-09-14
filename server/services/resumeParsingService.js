import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export async function extractResumeText(file) {
  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer })
    try { return (await parser.getText()).text.trim() } finally { await parser.destroy() }
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer })
  return result.value.trim()
}

function fallbackParse(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const skillHeading = lines.findIndex((line) => /^((technical|core) )?skills:?$/i.test(line))
  const skills = skillHeading < 0 ? [] : (lines[skillHeading + 1] || '').split(/[,|•]/).map((item) => item.trim()).filter(Boolean).slice(0, 30)
  return { professionalTitle: '', professionalSummary: '', skills, experience: [], education: [], projects: [] }
}

const clean = (value) => typeof value === 'string' ? value.trim() : ''
const first = (item, keys) => keys.map((key) => clean(item?.[key])).find(Boolean) || ''

function splitDateRange(value) {
  const range = clean(value)
  if (!range) return ['', '']
  const parts = range.split(/\s+(?:to|[-–—])\s+/i).map((part) => part.trim()).filter(Boolean)
  return parts.length > 1 ? [parts[0], parts.slice(1).join(' - ')] : [range, '']
}

function normalizeExperience(item) {
  if (!item || typeof item !== 'object') return null
  const rangeValue = first(item, ['dateRange', 'date_range', 'dates', 'date', 'duration', 'period', 'tenure'])
  const [rangeStart, rangeEnd] = splitDateRange(rangeValue)
  const startDate = first(item, ['startDate', 'start_date', 'from', 'start']) || rangeStart
  let endDate = first(item, ['endDate', 'end_date', 'to', 'end']) || rangeEnd
  const current = Boolean(item.current || item.isCurrent) || /^(present|current|now|ongoing)$/i.test(endDate)
  if (current && !endDate) endDate = 'Present'
  return {
    ...item,
    jobTitle: first(item, ['jobTitle', 'job_title', 'title', 'position', 'role']),
    company: first(item, ['company', 'companyName', 'company_name', 'employer', 'organization']),
    location: first(item, ['location']),
    startDate,
    endDate,
    current,
    description: first(item, ['description', 'summary', 'highlights', 'responsibilities']),
  }
}

function normalizeEducation(item) {
  if (!item || typeof item !== 'object') return null
  const rangeValue = first(item, ['dateRange', 'date_range', 'dates', 'date', 'duration', 'period'])
  const [rangeStart, rangeEnd] = splitDateRange(rangeValue)
  return {
    ...item,
    school: first(item, ['school', 'schoolName', 'school_name', 'institution', 'institutionName', 'institution_name', 'university', 'college']),
    degree: first(item, ['degree', 'degreeName', 'degree_name', 'qualification']),
    fieldOfStudy: first(item, ['fieldOfStudy', 'field_of_study', 'field', 'major', 'course']),
    startDate: first(item, ['startDate', 'start_date', 'from', 'start']) || rangeStart,
    endDate: first(item, ['endDate', 'end_date', 'to', 'end', 'graduationDate', 'graduation_date']) || rangeEnd,
    description: first(item, ['description', 'summary', 'details', 'highlights', 'coursework']),
  }
}

export function normalizeParsedResume(parsed = {}) {
  return {
    ...parsed,
    experience: Array.isArray(parsed.experience) ? parsed.experience.map(normalizeExperience).filter(Boolean) : [],
    education: Array.isArray(parsed.education) ? parsed.education.map(normalizeEducation).filter(Boolean) : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
  }
}

export async function parseResumeText(text) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.AI_API
  if (!apiKey) return { ...fallbackParse(text), parsingMode: 'basic' }
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Extract only facts explicitly present in the CV. Never invent or infer qualifications. Return JSON with professionalTitle, professionalSummary, skills (strings), experience, education, and projects (arrays of objects). Every experience object must use jobTitle, company, location, startDate, endDate, current, and description. Every education object must use school, degree, fieldOfStudy, startDate, endDate, and description. Preserve dates exactly as written; split a date range into startDate and endDate, and use current=true when an employment end date is Present or Current. Use empty values when absent.' }] },
      contents: [{ role: 'user', parts: [{ text: text.slice(0, 60000) }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Gemini parsing is temporarily unavailable')
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  if (!content) throw new Error('Gemini returned no resume data')
  return { ...normalizeParsedResume({ ...fallbackParse(text), ...JSON.parse(content) }), parsingMode: 'ai' }
}
