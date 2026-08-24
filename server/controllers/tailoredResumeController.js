import mongoose from 'mongoose'
import CareerProfile from '../models/CareerProfile.js'
import Job from '../models/Job.js'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { renderResumePdf } from '../services/pdfService.js'
import { tailorResume } from '../services/resumeTailoringService.js'

async function owner(req) { return User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id') }
async function ownedTailored(req) { const user = await owner(req); return user && Resume.findOne({ _id: req.params.id, userId: user._id, type: 'TAILORED' }) }

export async function generateTailoredResume(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ message: 'Invalid job ID' })
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const [profile, master, job] = await Promise.all([CareerProfile.findOne({ userId: user._id }).lean(), Resume.findOne({ userId: user._id, type: 'MASTER', status: 'APPROVED' }).lean(), Job.findById(req.params.jobId).lean()])
    if (!profile) return res.status(409).json({ message: 'Complete your career profile first' })
    if (!master) return res.status(409).json({ message: 'Review and approve your master CV first' })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    const tailored = await tailorResume(profile, master, job)
    const { generationMode, ...resumeData } = tailored
    const resume = await Resume.findOneAndUpdate({ userId: user._id, targetJobId: job._id, type: 'TAILORED' }, { $set: { ...resumeData, name: `${profile.fullName} - ${job.title}`, parsedText: master.parsedText, status: 'APPROVED', approvedAt: new Date() }, $setOnInsert: { userId: user._id, targetJobId: job._id, type: 'TAILORED' } }, { upsert: true, returnDocument: 'after', runValidators: true })
    res.status(201).json({ resume, job, generationMode })
  } catch (error) { next(error) }
}

export async function getTailoredResume(req, res, next) {
  try { const resume = await ownedTailored(req); if (!resume) return res.status(404).json({ message: 'Tailored CV not found' }); res.json({ resume, job: await Job.findById(resume.targetJobId) }) } catch (error) { next(error) }
}

export async function downloadTailoredResume(req, res, next) {
  try {
    const resume = await ownedTailored(req)
    if (!resume) return res.status(404).json({ message: 'Tailored CV not found' })
    const [profile, job] = await Promise.all([CareerProfile.findOne({ userId: resume.userId }).lean(), Job.findById(resume.targetJobId).lean()])
    if (!profile || !job) return res.status(409).json({ message: 'CV source data is no longer available' })
    const filename = `${resume.name || 'tailored-cv'}.pdf`.replace(/[^a-z0-9._ -]/gi, '').replace(/\s+/g, '-')
    res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    renderResumePdf(resume.toObject(), profile, job, res)
  } catch (error) { next(error) }
}
