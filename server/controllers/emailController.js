import Application from '../models/Application.js'
import CareerProfile from '../models/CareerProfile.js'
import GmailConnection from '../models/GmailConnection.js'
import Job from '../models/Job.js'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { completeOAuthAttempt, createMimeMessage, recordOAuthCallback, sendGmailMessage, startOAuthAttempt } from '../services/gmailService.js'
import { createResumePdfBuffer } from '../services/pdfService.js'
import { recordApplicationEvent } from '../services/applicationEventService.js'

async function owner(req) { return User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id') }

export async function connectGmail(req, res, next) { try { const user = await owner(req); if (!user) return res.status(404).json({ message: 'User account not found' }); const attempt = await startOAuthAttempt(user._id); res.json({ url: attempt.url }) } catch (error) { next(error) } }

export async function gmailCallback(req, res, next) {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    if (req.query.error) return res.redirect(`${clientUrl}/settings/email?gmail=denied`)
    const attempt = await recordOAuthCallback(req.query.state, req.query.code)
    res.redirect(`${clientUrl}/settings/email?gmail=finalize&attempt=${encodeURIComponent(attempt._id)}`)
  } catch (error) { next(error) }
}

export async function finalizeGmail(req, res, next) {
  try {
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    await completeOAuthAttempt(req.body.attemptId, user._id)
    res.json({ connected: true })
  } catch (error) { next(error) }
}

export async function gmailStatus(req, res, next) { try { const user = await owner(req); const connection = user && await GmailConnection.findOne({ userId: user._id }).select('connectedAt tokenExpiry'); res.json({ connected: Boolean(connection), connectedAt: connection?.connectedAt, tokenExpiry: connection?.tokenExpiry }) } catch (error) { next(error) } }

export async function disconnectGmail(req, res, next) { try { const user = await owner(req); if (user) await GmailConnection.deleteOne({ userId: user._id }); res.status(204).end() } catch (error) { next(error) } }

export async function sendApplication(req, res, next) {
  let lockedApplication
  const sendId = Math.random().toString(36).slice(2, 9)
  try {
    console.info(`[gmail:${sendId}] validating application`)
    const user = await owner(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    let existing = await Application.findOne({ _id: req.params.applicationId, userId: user._id })
    if (!existing) return res.status(404).json({ message: 'Application not found' })
    if (existing.status === 'PREPARING' && existing.updatedAt < new Date(Date.now() - 2 * 60 * 1000)) {
      existing.status = 'APPROVED'; await existing.save()
    }
    if (existing.status === 'APPLIED' || existing.gmailMessageId) return res.status(409).json({ message: 'This application has already been sent' })
    if (existing.status !== 'APPROVED') return res.status(409).json({ message: 'Only approved applications can be sent' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(existing.recipientEmail || '')) return res.status(409).json({ message: 'Add a valid recipient email before sending' })
    lockedApplication = await Application.findOneAndUpdate({ _id: existing._id, userId: user._id, status: 'APPROVED', gmailMessageId: { $exists: false } }, { $set: { status: 'PREPARING' } }, { returnDocument: 'after' })
    if (!lockedApplication) return res.status(409).json({ message: 'This application is already being sent' })
    console.info(`[gmail:${sendId}] building CV attachment`)
    const [resume, profile, job] = await Promise.all([Resume.findOne({ _id: lockedApplication.resumeId, userId: user._id }).lean(), CareerProfile.findOne({ userId: user._id }).lean(), Job.findById(lockedApplication.jobId).lean()])
    if (!resume || !profile || !job) throw Object.assign(new Error('Application attachment data is incomplete'), { statusCode: 409 })
    const pdf = await createResumePdfBuffer(resume, profile, job)
    const filename = `${profile.fullName}-${job.title}-CV.pdf`.replace(/[^a-z0-9._-]/gi, '-')
    const raw = createMimeMessage({ to: lockedApplication.recipientEmail, subject: lockedApplication.emailSubject, body: lockedApplication.emailBody, pdf, filename })
    console.info(`[gmail:${sendId}] sending to Gmail API`)
    const sent = await sendGmailMessage(user._id, raw)
    console.info(`[gmail:${sendId}] Gmail accepted message; recording result`)
    lockedApplication.status = 'APPLIED'; lockedApplication.gmailMessageId = sent.id; lockedApplication.appliedAt = new Date(); lockedApplication.lastSendAttemptAt = new Date(); lockedApplication.emailSendAttempts = (lockedApplication.emailSendAttempts || 0) + 1; lockedApplication.lastSendError = undefined; await lockedApplication.save()
    await recordApplicationEvent(lockedApplication, 'APPLIED', 'Application sent through Gmail.', { gmailMessageId: sent.id }).catch(() => {})
    res.json({ application: lockedApplication, message: 'Application sent through Gmail.' })
    console.info(`[gmail:${sendId}] completed`)
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') error = Object.assign(new Error('Google did not respond in time. Your application was not marked as sent; please try again.'), { statusCode: 504 })
    if (lockedApplication && lockedApplication.status === 'PREPARING') await Application.updateOne({ _id: lockedApplication._id, status: 'PREPARING' }, { $set: { status: 'APPROVED', lastSendAttemptAt: new Date(), lastSendError: error.message }, $inc: { emailSendAttempts: 1 } }).catch(() => {})
    console.warn(`[gmail:${sendId}] failed: ${error.message}`)
    next(error)
  }
}
