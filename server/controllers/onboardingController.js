import CareerProfile from '../models/CareerProfile.js'
import JobPreference from '../models/JobPreference.js'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import { nextOnboardingPath } from '../services/onboardingService.js'

export async function getOnboardingStatus(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const [profile, resume, preferences] = await Promise.all([CareerProfile.exists({ userId: user._id }), Resume.exists({ userId: user._id, type: 'MASTER', status: 'APPROVED' }), JobPreference.exists({ userId: user._id })])
    const steps = { profile: Boolean(profile), resume: Boolean(resume), preferences: Boolean(preferences) }
    const nextPath = nextOnboardingPath(steps)
    res.json({ completed: Object.values(steps).every(Boolean), steps, nextPath })
  } catch (error) { next(error) }
}
