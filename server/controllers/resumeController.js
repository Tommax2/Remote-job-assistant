import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { extractResumeText, parseResumeText } from '../services/resumeParsingService.js'
import { syncCareerProfileFromResume } from '../services/profileSyncService.js'

async function owner(req) { return User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id name email') }

export async function uploadResume(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Select a PDF or DOCX file' })
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const parsedText = await extractResumeText(req.file)
    if (!parsedText) return res.status(400).json({ message: 'No readable text was found in this CV' })
    const parsed = await parseResumeText(parsedText)
    const resume = await Resume.findOneAndUpdate(
      { userId: user._id, type: 'MASTER' },
      { $set: { name: req.file.originalname.replace(/\.(pdf|docx)$/i, ''), originalFileName: req.file.originalname, mimeType: req.file.mimetype, fileSize: req.file.size, parsedText, professionalTitle: parsed.professionalTitle || '', professionalSummary: parsed.professionalSummary || '', skills: parsed.skills || [], experience: parsed.experience || [], education: parsed.education || [], projects: parsed.projects || [], status: 'NEEDS_REVIEW' }, $setOnInsert: { userId: user._id, type: 'MASTER' }, $unset: { approvedAt: 1 } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
    res.status(201).json({ resume, parsingMode: parsed.parsingMode })
  } catch (error) { next(error) }
}

export async function listResumes(req, res, next) {
  try {
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    res.json({ resumes: await Resume.find({ userId: user._id }).sort({ updatedAt: -1 }) })
  } catch (error) { next(error) }
}

export async function getResume(req, res, next) {
  try {
    const user = await owner(req)
    const resume = user && await Resume.findOne({ _id: req.params.id, userId: user._id })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.json({ resume })
  } catch (error) { next(error) }
}

export async function updateResume(req, res, next) {
  try {
    const user = await owner(req)
    const fields = ['name', 'professionalTitle', 'professionalSummary', 'skills', 'experience', 'education', 'projects']
    const update = Object.fromEntries(fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]))
    if (req.body.approve === true) { update.status = 'APPROVED'; update.approvedAt = new Date() }
    const resume = user && await Resume.findOneAndUpdate({ _id: req.params.id, userId: user._id }, { $set: update }, { returnDocument: 'after', runValidators: true })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    let profile = null
    if (req.body.approve === true) profile = await syncCareerProfileFromResume(user, resume)
    res.json({ resume, profile, profileUpdated: Boolean(profile) })
  } catch (error) { next(error) }
}

export async function deleteResume(req, res, next) {
  try {
    const user = await owner(req)
    const resume = user && await Resume.findOneAndDelete({ _id: req.params.id, userId: user._id })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.status(204).end()
  } catch (error) { next(error) }
}
