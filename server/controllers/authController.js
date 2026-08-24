import User from '../models/User.js'
export async function syncUser(req, res, next) {
  try {
    const { uid, email, name, picture } = req.firebaseUser
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { email, name: name || email.split('@')[0], avatarUrl: picture || '' } },
      { returnDocument: 'after', upsert: true, runValidators: true },
    )
    res.json({ user: user.toPublicJSON() })
  } catch (error) { next(error) }
}
