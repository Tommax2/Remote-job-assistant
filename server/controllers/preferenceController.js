import JobPreference from '../models/JobPreference.js'
import User from '../models/User.js'

const allowedFields = ['jobTitles', 'skills', 'remoteOnly', 'preferredLocations', 'workFromLocations', 'employmentTypes', 'experienceLevels', 'minimumSalary', 'salaryCurrency', 'minimumMatchScore']
const cleanPayload = (body) => Object.fromEntries(allowedFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
const currentUser = (req) => User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')

export async function getPreferences(req, res, next) {
  try {
    const user = await currentUser(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    res.json({ preferences: await JobPreference.findOne({ userId: user._id }) })
  } catch (error) { next(error) }
}

export async function savePreferences(req, res, next) {
  try {
    const user = await currentUser(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const preferences = await JobPreference.findOneAndUpdate(
      { userId: user._id },
      { $set: cleanPayload(req.body), $setOnInsert: { userId: user._id } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
    res.json({ preferences })
  } catch (error) { next(error) }
}
