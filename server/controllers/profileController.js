import CareerProfile from '../models/CareerProfile.js'
import User from '../models/User.js'

const allowedFields = [
  'fullName', 'phone', 'email', 'location', 'professionalTitle',
  'professionalSummary', 'yearsOfExperience', 'skills', 'experience',
  'education', 'projects', 'portfolio',
]

function cleanPayload(body) {
  return Object.fromEntries(allowedFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
}

async function currentUser(req) {
  return User.findOne({ firebaseUid: req.firebaseUser.uid }).select('_id')
}

export async function getProfile(req, res, next) {
  try {
    const user = await currentUser(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const profile = await CareerProfile.findOne({ userId: user._id })
    res.json({ profile })
  } catch (error) { next(error) }
}

export async function saveProfile(req, res, next) {
  try {
    const user = await currentUser(req)
    if (!user) return res.status(404).json({ message: 'User account not found' })
    const profile = await CareerProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: cleanPayload(req.body), $setOnInsert: { userId: user._id } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
    res.status(200).json({ profile })
  } catch (error) { next(error) }
}
