import { createContext, useContext, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { api } from '../services/api'
import { auth, googleProvider } from '../config/firebase'

const AuthContext = createContext(null)

const authMessages = {
  'auth/email-already-in-use': 'An account already exists with this email. Sign in instead, or continue with Google.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'The email or password is incorrect. Please check your details and try again.',
  'auth/user-not-found': 'The email or password is incorrect. Please check your details and try again.',
  'auth/wrong-password': 'The email or password is incorrect. Please check your details and try again.',
  'auth/weak-password': 'Create a stronger password with at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts were made. Wait a few minutes before trying again.',
  'auth/network-request-failed': 'Unable to reach the sign-in service. Check your internet connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled before it finished.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
  'auth/account-exists-with-different-credential': 'This email already uses another sign-in method. Use that method to continue.',
  'auth/unauthorized-domain': 'Sign-in is not enabled for this website domain. Please contact support.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled yet. Please continue with Google or contact support.',
  'auth/configuration-not-found': 'Email and password sign-in is not enabled yet. Please continue with Google or contact support.',
  'auth/invalid-api-key': 'Sign-in is temporarily unavailable because the app is not configured correctly.',
  'auth/app-not-authorized': 'Sign-in is temporarily unavailable because this app is not authorized in Firebase.',
}

function friendlyAuthError(error) {
  const message = authMessages[error?.code]
  if (message) return new Error(message)
  if (error?.message && !String(error.message).includes('Firebase')) return error
  return new Error('We could not complete sign-in. Please try again or continue with Google.')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { user: appUser } = await api('/auth/sync', { method: 'POST' })
      setUser(appUser)
    } catch {
      setUser({ id: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email, email: firebaseUser.email })
    } finally {
      setLoading(false)
    }
  }), [])

  async function authenticate(mode, credentials) {
    const email = credentials.email.trim().toLowerCase()
    try {
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, credentials.password)
        await updateProfile(result.user, { displayName: credentials.name.trim() })
        await api('/auth/sync', { method: 'POST' })
      } else {
        await signInWithEmailAndPassword(auth, email, credentials.password)
      }
    } catch (error) { throw friendlyAuthError(error) }
  }

  async function loginWithGoogle() {
    try { await signInWithPopup(auth, googleProvider) } catch (error) { throw friendlyAuthError(error) }
  }

  async function logout() {
    await signOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, authenticate, loginWithGoogle, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
