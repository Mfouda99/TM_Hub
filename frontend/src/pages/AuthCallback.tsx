import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function AuthCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setMember = useAuthStore((s) => s.setMember)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')
    const code = params.get('code')

    if (!token || !refresh) {
      // If EXPA redirected here with only an OAuth code, hand it to backend callback
      // so backend can exchange code and redirect back with JWT tokens.
      if (code) {
        window.location.href = `${BASE_URL}/api/auth/callback?code=${encodeURIComponent(code)}`
        return
      }

      // Try direct token-based login if EXPA_ACCESS_TOKEN is configured
      api
        .post('/api/auth/token-login/')
        .then((res) => {
          const { access_token, refresh_token, member } = res.data
          setAuth({ token: access_token, refresh: refresh_token })
          setMember(member)
          const fn = (member.function as string).toLowerCase()
          navigate(`/${fn}`, { replace: true })
        })
        .catch(() => navigate('/login', { replace: true }))
      return
    }

    setAuth({ token, refresh })

    api
      .get('/api/auth/me/', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setMember(res.data)
        const fn = (res.data.function as string).toLowerCase()
        navigate(`/${fn}`, { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate, setAuth, setMember])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300 text-lg font-medium">Signing you in…</p>
        <p className="text-gray-500 text-sm mt-1">Please wait</p>
      </div>
    </div>
  )
}
