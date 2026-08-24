import { createContext, useContext, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { api } from '../services/api'
import { auth, googleProvider } from '../config/firebase'

const AuthContext = createContext(null)

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
    if (mode === 'register') {
      const result = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
      await updateProfile(result.user, { displayName: credentials.name })
      await api('/auth/sync', { method: 'POST' })
    } else {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
    }
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, authenticate, loginWithGoogle, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
