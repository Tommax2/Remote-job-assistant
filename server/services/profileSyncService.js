import CareerProfile from '../models/CareerProfile.js'

const text = (value) => typeof value === 'string' ? value.trim() : ''
const url = (value) => /^https?:\/\//i.test(text(value)) ? text(value) : ''
const list = (value) => Array.isArray(value) ? value : []

function normalizeExperience(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    jobTitle: text(item.jobTitle || item.title || item.position),
    company: text(item.company || item.companyName), location: text(item.location),
    startDate: text(item.startDate || item.start), endDate: text(item.endDate || item.end),
    current: Boolean(item.current), description: text(item.description || item.summary),
  }))
}

function normalizeEducation(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    school: text(item.school || item.institution || item.university), degree: text(item.degree),
    fieldOfStudy: text(item.fieldOfStudy || item.field || item.major),
    startDate: text(item.startDate || item.start), endDate: text(item.endDate || item.end || item.graduationDate),
  }))
}

function normalizeProjects(items) {
  return list(items).filter((item) => item && typeof item === 'object').map((item) => ({
    name: text(item.name || item.title), description: text(item.description || item.summary),
    technologies: list(item.technologies || item.skills).map(text).filter(Boolean),
    url: url(item.url || item.link),
  }))
}

export function profileFieldsFromResume(resume) {
  const update = {}
  if (resume.professionalTitle?.trim()) update.professionalTitle = resume.professionalTitle.trim()
  if (resume.professionalSummary?.trim()) update.professionalSummary = resume.professionalSummary.trim()
  if (resume.skills?.length) update.skills = list(resume.skills).map(text).filter(Boolean)
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
