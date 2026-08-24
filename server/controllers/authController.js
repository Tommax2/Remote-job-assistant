import User from '../models/User.js'
export async function syncUser(req, res, next) {
  try {
    const { uid, email, name, picture, email_verified: emailVerified } = req.firebaseUser
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const details = { email: normalizedEmail, name: name || normalizedEmail.split('@')[0], avatarUrl: picture || '' }
    let user = await User.findOne({ firebaseUid: uid })

    // Firebase may issue a new UID when an administrator deletes and the owner
    // recreates a Google account. A verified email can safely reclaim its
    // existing profile and application data instead of creating a duplicate user.
    if (!user) {
      const existingEmail = await User.findOne({ email: normalizedEmail })
      if (existingEmail && !emailVerified) throw Object.assign(new Error('Verify this email before restoring the existing account'), { statusCode: 409 })
      if (existingEmail) {
        existingEmail.firebaseUid = uid
        Object.assign(existingEmail, details)
        user = await existingEmail.save()
      } else {
        user = await User.create({ firebaseUid: uid, ...details })
      }
    } else {
      Object.assign(user, details)
      await user.save()
    }
    res.json({ user: user.toPublicJSON() })
  } catch (error) { next(error) }
}
