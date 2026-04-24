import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Member } from '../types'

interface AuthState {
  token: string | null
  refresh: string | null
  member: Member | null
  hasHydrated: boolean
  setAuth: (data: { token: string; refresh: string; member?: Member }) => void
  setMember: (member: Member) => void
  setHasHydrated: (state: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refresh: null,
      member: null,
      hasHydrated: false,
      setAuth: ({ token, refresh, member }) =>
        set({ token, refresh, member: member ?? null }),
      setMember: (member) => set({ member }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      logout: () => set({ token: null, refresh: null, member: null }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
