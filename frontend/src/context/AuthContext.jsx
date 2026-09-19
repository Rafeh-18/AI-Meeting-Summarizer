import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(payload) {
    const data = await authService.login(payload)
    setUser(data.user)
    return data
  }

  async function register(payload) {
    const data = await authService.register(payload)
    setUser(data.user)
    return data
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  async function updateProfile(payload) {
  const data = await authService.updateProfile(payload)
  setUser(data.user)
  return data
}

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


