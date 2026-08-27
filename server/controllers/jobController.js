import mongoose from 'mongoose'
import Job from '../models/Job.js'
import JobMatch from '../models/JobMatch.js'
import User from '../models/User.js'
import SavedJob from '../models/SavedJob.js'
import IgnoredJob from '../models/IgnoredJob.js'
import { extractApplicationEmail } from '../services/jobEmailService.js'
import { syncJobsSafely } from '../services/jobService.js'
import { analyzeJobMatch, createPreliminaryMatches } from '../services/matchingService.js'

export async function syncJobs(_req, res, next) {
  try { res.json(await syncJobsSafely()) } catch (error) { next(error) }
}

export async function listJobs(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const query = { active: true }
    const ignoredIds = await IgnoredJob.find({ userId: user._id }).distinct('jobId')
    if (ignoredIds.length) query._id = { $nin: ignoredIds }
    if (req.query.search) query.$text = { $search: String(req.query.search).slice(0, 100) }
    if (req.query.location) query.location = { $regex: String(req.query.location).slice(0, 80), $options: 'i' }
    if (req.query.employmentType) query.employmentType = req.query.employmentType
    if (req.query.market === 'NIGERIA') query.nigeriaBased = true
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 50)
    const [jobs, total, savedIds] = await Promise.all([Job.find(query).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit), Job.countDocuments(query), SavedJob.find({ userId: user._id }).distinct('jobId')])
    const saved = new Set(savedIds.map(String))
    let matches = new Map()
    if (user) {
      try { matches = await createPreliminaryMatches(user._id, jobs) } catch (error) { if (error.statusCode !== 409) throw error }
    }
    const enriched = jobs.map((job) => ({ ...job.toObject(), match: matches.get(String(job._id)) || null, saved: saved.has(String(job._id)) }))
    res.json({ jobs: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export async function analyzeMatch(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')
    if (!user) return res.status(404).json({ message: 'User account not found' })
    res.json({ match: await analyzeJobMatch(user._id, req.params.id) })
  } catch (error) { next(error) }
}

export async function getMatch(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')
    const match = user && await JobMatch.findOne({ userId: user._id, jobId: req.params.id })
    if (!match) return res.status(404).json({ message: 'Match analysis not found' })
    res.json({ match })
  } catch (error) { next(error) }
}

export async function getJob(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid job ID' })
    const [job, user] = await Promise.all([Job.findOne({ _id: req.params.id, active: true }), User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')])
    if (!job) return res.status(404).json({ message: 'Job not found' })
    if (!job.applicationEmail) { const extracted = extractApplicationEmail(job.applicationUrl, job.description); if (extracted) { job.applicationEmail = extracted; await job.save() } }
    const [saved, ignored] = user ? await Promise.all([SavedJob.exists({ userId: user._id, jobId: job._id }), IgnoredJob.exists({ userId: user._id, jobId: job._id })]) : [false, false]
    res.json({ job: { ...job.toObject(), saved: Boolean(saved), ignored: Boolean(ignored) } })
  } catch (error) { next(error) }
}

export async function saveJob(req, res, next) {
  try { const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id'); const job = user && await Job.findOne({ _id: req.params.id, active: true }).select('_id'); if (!job) return res.status(404).json({ message: 'Job not found' }); await IgnoredJob.deleteOne({ userId: user._id, jobId: job._id }); const savedJob = await SavedJob.findOneAndUpdate({ userId: user._id, jobId: job._id }, { $setOnInsert: { userId: user._id, jobId: job._id } }, { upsert: true, returnDocument: 'after' }); res.status(201).json({ savedJob }) } catch (error) { next(error) }
}

export async function unsaveJob(req, res, next) {
  try { const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id'); if (user) await SavedJob.deleteOne({ userId: user._id, jobId: req.params.id }); res.status(204).end() } catch (error) { next(error) }
}

export async function ignoreJob(req, res, next) {
  try { const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id'); const job = user && await Job.findOne({ _id: req.params.id, active: true }).select('_id'); if (!job) return res.status(404).json({ message: 'Job not found' }); await SavedJob.deleteOne({ userId: user._id, jobId: job._id }); const ignoredJob = await IgnoredJob.findOneAndUpdate({ userId: user._id, jobId: job._id }, { $setOnInsert: { userId: user._id, jobId: job._id } }, { upsert: true, returnDocument: 'after' }); res.status(201).json({ ignoredJob }) } catch (error) { next(error) }
}

export async function listSavedJobs(req, res, next) {
  try { const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id'); if (!user) return res.status(404).json({ message: 'User account not found' }); const records = await SavedJob.find({ userId: user._id }).sort({ createdAt: -1 }).populate('jobId'); const jobs = records.map((record) => record.jobId).filter((job) => job?.active); let matches = new Map(); try { matches = await createPreliminaryMatches(user._id, jobs) } catch (error) { if (error.statusCode !== 409) throw error }; res.json({ jobs: jobs.map((job) => ({ ...job.toObject(), saved: true, match: matches.get(String(job._id)) || null })) }) } catch (error) { next(error) }
}
