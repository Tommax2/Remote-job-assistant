import Application from '../models/Application.js'
import CareerProfile from '../models/CareerProfile.js'
import Job from '../models/Job.js'
import JobMatch from '../models/JobMatch.js'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { generateApplicationEmail } from '../services/emailGeneratorService.js'
import { validateApplicationForApproval } from '../services/applicationService.js'
import { tailorResume } from '../services/resumeTailoringService.js'
import ApplicationEvent from '../models/ApplicationEvent.js'
import { allowedManualStatus, recordApplicationEvent } from '../services/applicationEventService.js'
import { extractApplicationEmail } from '../services/jobEmailService.js'

async function owner(req) { return User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id') }

export async function listApplications(req, res, next) {
  try {
    const user = await owner(req); if (!user) return res.status(404).json({ message: 'User account not found' })
    const query = { userId: user._id }
    if (req.query.status) query.status = String(req.query.status)
    if (req.query.search) { const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ company: { $regex: search, $options: 'i' } }, { position: { $regex: search, $options: 'i' } }] }
    const [applications, counts] = await Promise.all([Application.find(query).sort({ updatedAt: -1 }).limit(100), Application.aggregate([{ $match: { userId: user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }])])
    const stats = Object.fromEntries(counts.map((item) => [item._id, item.count])); stats.TOTAL = counts.reduce((total, item) => total + item.count, 0)
    res.json({ applications, stats })
  } catch (error) { next(error) }
}

export async function prepareBatch(req, res, next) {
  try {
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const jobIds = [...new Set((req.body.jobIds || []).map(String))]
    if (!jobIds.length || jobIds.length > 5) return res.status(400).json({ message: 'Select between 1 and 5 jobs per batch' })
    const [profile, master, jobs, matches] = await Promise.all([CareerProfile.findOne({ userId: user._id }).lean(), Resume.findOne({ userId: user._id, type: 'MASTER', status: 'APPROVED' }).lean(), Job.find({ _id: { $in: jobIds }, active: true }).lean(), JobMatch.find({ userId: user._id, jobId: { $in: jobIds } }).lean()])
    if (!profile) return res.status(409).json({ message: 'Complete your career profile first' })
    if (!master) return res.status(409).json({ message: 'Review and approve your master CV first' })
    const matchByJob = new Map(matches.map((match) => [String(match.jobId), match]))
    const results = await Promise.all(jobs.map(async (job) => {
      const existing = await Application.findOne({ userId: user._id, jobId: job._id })
      if (existing?.status === 'APPLIED') return { jobId: job._id, applicationId: existing._id, status: 'SKIPPED', message: 'Already applied' }
      try {
        const tailored = await tailorResume(profile, master, job); const { generationMode: _tailoringMode, ...resumeData } = tailored
        const resume = await Resume.findOneAndUpdate({ userId: user._id, targetJobId: job._id, type: 'TAILORED' }, { $set: { ...resumeData, name: `${profile.fullName} - ${job.title}`, parsedText: master.parsedText, status: 'APPROVED', approvedAt: new Date() }, $setOnInsert: { userId: user._id, targetJobId: job._id, type: 'TAILORED' } }, { upsert: true, returnDocument: 'after', runValidators: true })
        const email = await generateApplicationEmail(profile, resume.toObject(), job)
        const application = await Application.findOneAndUpdate({ userId: user._id, jobId: job._id }, { $set: { resumeId: resume._id, company: job.company, position: job.title, matchScore: matchByJob.get(String(job._id))?.overallScore, emailSubject: email.subject, emailBody: email.body, status: 'READY_FOR_REVIEW', generationMode: email.generationMode, preparedAt: new Date() }, $setOnInsert: { userId: user._id, jobId: job._id, recipientEmail: job.applicationEmail || extractApplicationEmail(job.applicationUrl, job.description) } }, { upsert: true, returnDocument: 'after', runValidators: true })
        if (!application.recipientEmail) { application.recipientEmail = job.applicationEmail || extractApplicationEmail(job.applicationUrl, job.description); if (application.recipientEmail) await application.save() }
        await recordApplicationEvent(application, 'READY_FOR_REVIEW', 'Tailored CV and application email generated.').catch(() => {})
        return { jobId: job._id, applicationId: application._id, status: 'PREPARED' }
      } catch (error) { return { jobId: job._id, status: 'FAILED', message: error.message } }
    }))
    const missing = jobIds.filter((id) => !jobs.some((job) => String(job._id) === id)).map((jobId) => ({ jobId, status: 'FAILED', message: 'Job not found' }))
    res.status(201).json({ results: [...results, ...missing], prepared: results.filter((item) => item.status === 'PREPARED').length })
  } catch (error) { next(error) }
}

export async function generateEmail(req, res, next) {
  try {
    const user = await owner(req)
    const resume = user && await Resume.findOne({ _id: req.params.resumeId, userId: user._id, type: 'TAILORED' }).lean()
    if (!resume) return res.status(404).json({ message: 'Tailored CV not found' })
    const [profile, job, match] = await Promise.all([CareerProfile.findOne({ userId: user._id }).lean(), Job.findById(resume.targetJobId).lean(), JobMatch.findOne({ userId: user._id, jobId: resume.targetJobId }).lean()])
    if (!profile || !job) return res.status(409).json({ message: 'Application source data is incomplete' })
    const email = await generateApplicationEmail(profile, resume, job)
    const application = await Application.findOneAndUpdate({ userId: user._id, jobId: job._id }, { $set: { resumeId: resume._id, company: job.company, position: job.title, matchScore: match?.overallScore, emailSubject: email.subject, emailBody: email.body, status: 'READY_FOR_REVIEW', generationMode: email.generationMode, preparedAt: new Date() }, $setOnInsert: { userId: user._id, jobId: job._id, recipientEmail: job.applicationEmail || extractApplicationEmail(job.applicationUrl, job.description) } }, { upsert: true, returnDocument: 'after', runValidators: true })
    if (!application.recipientEmail) { application.recipientEmail = job.applicationEmail || extractApplicationEmail(job.applicationUrl, job.description); if (application.recipientEmail) await application.save() }
    await recordApplicationEvent(application, 'READY_FOR_REVIEW', 'Tailored CV and application email generated.').catch(() => {})
    res.status(201).json({ application, job, generationMode: email.generationMode })
  } catch (error) { next(error) }
}

export async function getApplication(req, res, next) {
  try { const user = await owner(req); const application = user && await Application.findOne({ _id: req.params.id, userId: user._id }); if (!application) return res.status(404).json({ message: 'Application draft not found' }); const [job, resume, events] = await Promise.all([Job.findById(application.jobId), Resume.findOne({ _id: application.resumeId, userId: user._id }), ApplicationEvent.find({ applicationId: application._id, userId: user._id }).sort({ eventDate: -1 })]); res.json({ application, job, resume, events }) } catch (error) { next(error) }
}

export async function updateApplication(req, res, next) {
  try {
    const user = await owner(req); const update = {}
    if (req.body.emailSubject !== undefined) update.emailSubject = String(req.body.emailSubject).trim()
    if (req.body.emailBody !== undefined) update.emailBody = String(req.body.emailBody)
    if (req.body.recipientEmail !== undefined) {
      const recipientEmail = String(req.body.recipientEmail).trim().toLowerCase()
      if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return res.status(400).json({ message: 'Enter a valid recipient email' })
      update.recipientEmail = recipientEmail
    }
    const application = user && await Application.findOneAndUpdate({ _id: req.params.id, userId: user._id }, { $set: update }, { returnDocument: 'after', runValidators: true })
    if (!application) return res.status(404).json({ message: 'Application draft not found' })
    res.json({ application })
  } catch (error) { next(error) }
}

export async function regenerateEmail(req, res, next) {
  try { const user = await owner(req); const application = user && await Application.findOne({ _id: req.params.id, userId: user._id }); if (!application) return res.status(404).json({ message: 'Application draft not found' }); req.params.resumeId = String(application.resumeId); return generateEmail(req, res, next) } catch (error) { next(error) }
}

export async function approveApplication(req, res, next) {
  try {
    const user = await owner(req)
    const application = user && await Application.findOne({ _id: req.params.id, userId: user._id })
    const resume = application && await Resume.findOne({ _id: application.resumeId, userId: user._id })
    const validationError = validateApplicationForApproval(application, resume)
    if (validationError) return res.status(application ? 409 : 404).json({ message: validationError })
    if (application.status !== 'APPROVED') { application.status = 'APPROVED'; application.approvedAt = new Date(); await application.save(); await recordApplicationEvent(application, 'APPROVED', 'The user reviewed and approved the CV and email.').catch(() => {}) }
    res.json({ application, message: 'Application approved. Nothing has been sent.' })
  } catch (error) { next(error) }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const user = await owner(req); const status = String(req.body.status || '').toUpperCase()
    if (!allowedManualStatus(status)) return res.status(400).json({ message: 'Choose Assessment, Interview, Offer, Rejected, or Withdrawn' })
    const application = user && await Application.findOne({ _id: req.params.id, userId: user._id })
    if (!application) return res.status(404).json({ message: 'Application not found' })
    if (!['APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].includes(application.status)) return res.status(409).json({ message: 'Send the approved application before tracking employer outcomes' })
    application.status = status; await application.save()
    const event = await recordApplicationEvent(application, status, String(req.body.note || '').trim())
    res.json({ application, event })
  } catch (error) { next(error) }
}
