import CareerProfile from '../models/CareerProfile.js'

const text = (value, maxLength) => {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return maxLength ? normalized.slice(0, maxLength) : normalized
}
const url = (value) => /^https?:\/\//i.test(text(value)) ? text(value) : ''
const list = (value) => Array.isArray(value) ? value : []

function normalizeExperience(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    jobTitle: text(item.jobTitle || item.title || item.position, 120),
    company: text(item.company || item.companyName, 120), location: text(item.location, 120),
    startDate: text(item.startDate || item.start, 30), endDate: text(item.endDate || item.end, 30),
    current: Boolean(item.current), description: text(item.description || item.summary, 2000),
  }))
}

function normalizeEducation(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    school: text(item.school || item.institution || item.university, 160), degree: text(item.degree, 160),
    fieldOfStudy: text(item.fieldOfStudy || item.field || item.major, 160),
    startDate: text(item.startDate || item.start, 30), endDate: text(item.endDate || item.end || item.graduationDate, 30),
    description: text(item.description || item.summary || item.details, 2000),
  }))
}

function normalizeProjects(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    name: text(item.name || item.title, 160), description: text(item.description || item.summary, 2000),
    technologies: list(item.technologies || item.skills).map((value) => text(value, 60)).filter(Boolean),
    url: url(item.url || item.link),
  }))
}

export function profileFieldsFromResume(resume) {
  const update = {}
  if (resume.professionalTitle?.trim()) update.professionalTitle = text(resume.professionalTitle, 120)
  if (resume.professionalSummary?.trim()) update.professionalSummary = text(resume.professionalSummary, 3000)
  if (resume.skills?.length) update.skills = list(resume.skills).map((value) => text(value, 60)).filter(Boolean)
  if (resume.experience?.length) update.experience = normalizeExperience(resume.experience)
  if (resume.education?.length) update.education = normalizeEducation(resume.education)
  if (resume.projects?.length) update.projects = normalizeProjects(resume.projects)
  return update
}

export async function syncCareerProfileFromResume(user, resume) {
  const fields = profileFieldsFromResume(resume)
  const insertFields = { userId: user._id, fullName: user.name, email: user.email }
  if (!fields.professionalTitle) insertFields.professionalTitle = 'Professional'
  return CareerProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: fields,
      $setOnInsert: insertFields,
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )
}
