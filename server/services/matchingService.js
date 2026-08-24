import CareerProfile from '../models/CareerProfile.js'
import Job from '../models/Job.js'
import JobMatch from '../models/JobMatch.js'
import JobPreference from '../models/JobPreference.js'
import Resume from '../models/Resume.js'

const clamp = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim()
const unique = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()))]
const recommendation = (score) => score >= 80 ? 'STRONG_MATCH' : score >= 65 ? 'GOOD_MATCH' : score >= 45 ? 'POSSIBLE_MATCH' : 'LOW_MATCH'

function roleScore(profile, preferences, job) {
  const targets = unique([profile.professionalTitle, ...(preferences?.jobTitles || [])]).map(normalize)
  const title = normalize(job.title)
  if (!targets.length) return 50
  if (targets.some((target) => title.includes(target) || target.includes(title))) return 100
  const titleWords = new Set(title.split(' ').filter((word) => word.length > 2))
  const best = Math.max(...targets.map((target) => target.split(' ').filter((word) => word.length > 2).filter((word) => titleWords.has(word)).length / Math.max(target.split(' ').length, 1)))
  return clamp(best * 100)
}

function locationAnalysis(preferences, job) {
  const location = normalize(job.location)
  if (/worldwide|anywhere|global|all locations/.test(location)) return { score: 100, eligibility: 'ELIGIBLE' }
  const allowed = unique([...(preferences?.preferredLocations || []), ...(preferences?.workFromLocations || [])]).map(normalize)
  if (!allowed.length) return { score: 50, eligibility: 'REVIEW_LOCATION' }
  if (allowed.some((place) => location.includes(place) || place.includes(location))) return { score: 100, eligibility: 'ELIGIBLE' }
  if (/only|must be|residents|based in|usa|united states|canada|europe|uk|united kingdom/.test(location)) return { score: 0, eligibility: 'LIKELY_INELIGIBLE' }
  return { score: 35, eligibility: 'REVIEW_LOCATION' }
}

export function calculatePreliminaryMatch(profile, resume, preferences, job) {
  const skills = unique([...(profile.skills || []), ...(resume?.skills || [])])
  const description = normalize(`${job.title} ${job.description}`)
  const matchedSkills = skills.filter((skill) => description.includes(normalize(skill)))
  const preferredSkills = unique(preferences?.skills || [])
  const relevantPool = unique([...matchedSkills, ...preferredSkills.filter((skill) => description.includes(normalize(skill)))])
  const skillScore = skills.length ? clamp((matchedSkills.length / Math.min(Math.max(relevantPool.length, 5), skills.length)) * 100) : 0
  const requestedYears = Math.max(...[...description.matchAll(/(\d+)\+?\s*(?:years|yrs)/g)].map((match) => Number(match[1])), 0)
  const candidateYears = Number(profile.yearsOfExperience) || 0
  const experienceScore = requestedYears ? clamp((candidateYears / requestedYears) * 100) : candidateYears ? 80 : 50
  const educationScore = /bachelor|master|degree|bsc|msc|phd/.test(description) ? (profile.education?.length || resume?.education?.length ? 100 : 25) : 80
  const role = roleScore(profile, preferences, job)
  const location = locationAnalysis(preferences, job)
  const overallScore = clamp(skillScore * .4 + experienceScore * .25 + location.score * .2 + role * .1 + educationScore * .05)
  return { overallScore, skillScore, experienceScore, educationScore, locationScore: location.score, roleScore: role, matchedSkills, missingSkills: [], strengths: matchedSkills.slice(0, 5).map((skill) => `${skill} appears relevant to this role.`), gaps: location.eligibility === 'LIKELY_INELIGIBLE' ? [`Location restriction may exclude the candidate: ${job.location}`] : [], recommendation: recommendation(overallScore), eligibility: location.eligibility, analysisMode: 'PRELIMINARY' }
}

async function contextFor(userId) {
  const [profile, resume, preferences] = await Promise.all([CareerProfile.findOne({ userId }).lean(), Resume.findOne({ userId, type: 'MASTER', status: 'APPROVED' }).lean(), JobPreference.findOne({ userId }).lean()])
  if (!profile) throw Object.assign(new Error('Complete your career profile before matching jobs'), { statusCode: 409 })
  return { profile, resume, preferences }
}

async function saveMatch(userId, jobId, result) {
  return JobMatch.findOneAndUpdate({ userId, jobId }, { $set: result, $setOnInsert: { userId, jobId } }, { upsert: true, returnDocument: 'after', runValidators: true })
}

export async function createPreliminaryMatches(userId, jobs) {
  const context = await contextFor(userId)
  const results = await Promise.all(jobs.map((job) => saveMatch(userId, job._id, calculatePreliminaryMatch(context.profile, context.resume, context.preferences, job))))
  return new Map(results.map((match) => [String(match.jobId), match]))
}

export async function analyzeJobMatch(userId, jobId) {
  const [context, job] = await Promise.all([contextFor(userId), Job.findById(jobId).lean()])
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 })
  const base = calculatePreliminaryMatch(context.profile, context.resume, context.preferences, job)
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.AI_API
  if (!apiKey) return saveMatch(userId, jobId, base)
  try {
    const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite'
    const prompt = JSON.stringify({ candidate: { title: context.profile.professionalTitle, yearsOfExperience: context.profile.yearsOfExperience, skills: unique([...(context.profile.skills || []), ...(context.resume?.skills || [])]), education: context.profile.education, experience: context.profile.experience }, preferences: context.preferences, job: { title: job.title, location: job.location, description: job.description } })
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: 'Evaluate candidate-job fit using only supplied facts. Never invent skills or experience. Return JSON: skillScore, experienceScore, educationScore, locationScore, roleScore (0-100), matchedSkills, missingSkills, strengths, gaps, eligibility (ELIGIBLE, REVIEW_LOCATION, or LIKELY_INELIGIBLE). Treat location restrictions as important.' }] }, contents: [{ role: 'user', parts: [{ text: prompt.slice(0, 60000) }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json' } }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini matching is temporarily unavailable')
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}')
    const scores = { skillScore: clamp(parsed.skillScore), experienceScore: clamp(parsed.experienceScore), educationScore: clamp(parsed.educationScore), locationScore: clamp(parsed.locationScore), roleScore: clamp(parsed.roleScore) }
    const overallScore = clamp(scores.skillScore * .4 + scores.experienceScore * .25 + scores.locationScore * .2 + scores.roleScore * .1 + scores.educationScore * .05)
    return saveMatch(userId, jobId, { ...scores, overallScore, matchedSkills: unique(parsed.matchedSkills || []), missingSkills: unique(parsed.missingSkills || []), strengths: unique(parsed.strengths || []), gaps: unique(parsed.gaps || []), eligibility: ['ELIGIBLE', 'REVIEW_LOCATION', 'LIKELY_INELIGIBLE'].includes(parsed.eligibility) ? parsed.eligibility : base.eligibility, recommendation: recommendation(overallScore), analysisMode: 'GEMINI' })
  } catch (error) {
    console.warn(`Gemini match analysis unavailable; using preliminary match (${error.code || error.name || 'error'})`)
    return saveMatch(userId, jobId, base)
  }
}
