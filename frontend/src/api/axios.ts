import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isAlerting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authState = useAuthStore.getState()
      if (!isAlerting && authState.token) {
        isAlerting = true
        alert('Please re-login to authorize.')
        authState.logout()
        window.location.href = '/login'
        setTimeout(() => { isAlerting = false }, 1000)
      }
    }
    return Promise.reject(error)
  }
)

export default api
