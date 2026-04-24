import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setMember = useAuthStore((s) => s.setMember)
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const [loading, setLoading] = useState(false)
  const [directLoading, setDirectLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasHydrated && token) {
      navigate('/', { replace: true })
    }
  }, [hasHydrated, token, navigate])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauthError = params.get('oauth_error')
    if (oauthError) {
      setError(oauthError)
    }
  }, [location.search])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/auth/login/')
      window.location.href = res.data.auth_url
    } catch {
      setError('Could not connect to server. Please try again.')
      setLoading(false)
    }
  }

  const handleDirectLogin = async () => {
    setDirectLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/direct-login/')
      const { access_token, refresh_token, member } = res.data
      setAuth({ token: access_token, refresh: refresh_token })
      setMember(member)
      const fn = (member.function as string).toLowerCase()
      navigate(`/${fn}`, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Direct login failed. Check token configuration.')
      setDirectLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8 ">
            <img
              src="https://aiesec-logos.s3.eu-west-1.amazonaws.com/White-Blue-Logo.png"
              alt="AIESEC"
              className="w-25 h-25 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white">TM Hub</h1>
            
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            )}
            {loading ? 'Redirecting…' : 'Login with EXPA'}
          </button>
          <p className="text-center text-xs text-gray-600 mt-6">
            Powered by AIESEC EXPA OAuth
          </p>
        </div>
      </div>
    </div>
  )
}
