import { firebaseAuth } from '../config/firebase.js'

export async function protect(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ')
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication required' })
    req.firebaseUser = await firebaseAuth.verifyIdToken(token)
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}
