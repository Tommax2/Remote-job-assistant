import Application from '../models/Application.js'
import Job from '../models/Job.js'
import JobMatch from '../models/JobMatch.js'
import User from '../models/User.js'

export async function getDashboard(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id name')
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
    const [newJobsToday, strongMatches, prepared, sent, assessments, interviews, offers, topMatchRecords, recentApplications] = await Promise.all([
      Job.countDocuments({ active: true, publishedAt: { $gte: startOfToday } }),
      JobMatch.countDocuments({ userId: user._id, overallScore: { $gte: 80 } }),
      Application.countDocuments({ userId: user._id, status: { $in: ['READY_FOR_REVIEW', 'APPROVED', 'PREPARING'] } }),
      Application.countDocuments({ userId: user._id, appliedAt: { $exists: true, $ne: null } }),
      Application.countDocuments({ userId: user._id, status: 'ASSESSMENT' }),
      Application.countDocuments({ userId: user._id, status: 'INTERVIEW' }),
      Application.countDocuments({ userId: user._id, status: 'OFFER' }),
      JobMatch.find({ userId: user._id }).sort({ overallScore: -1, updatedAt: -1 }).limit(5).populate({ path: 'jobId', match: { active: true }, select: 'company title location employmentType publishedAt' }).lean(),
      Application.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(5).select('company position status matchScore preparedAt appliedAt updatedAt').lean(),
    ])
    const topMatches = topMatchRecords.filter((match) => match.jobId).map((match) => ({ job: match.jobId, overallScore: match.overallScore, recommendation: match.recommendation, matchedSkills: match.matchedSkills.slice(0, 3) }))
    res.json({ metrics: { newJobsToday, strongMatches, prepared, sent, assessments, interviews, offers }, topMatches, recentApplications })
  } catch (error) { next(error) }
}
