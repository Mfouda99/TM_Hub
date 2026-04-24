import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Users } from 'lucide-react'
import api from '../../api/axios'
import MemberTable from '../../components/MemberTable'
import { Member } from '../../types'

const FUNCTIONS = ['iGV', 'oGV', 'iGTa', 'oGTa', 'iGTe', 'oGTe', 'MKT', 'FIN', 'TM', 'BD', 'PM', 'OTHER']

export default function Members() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Member | null>(null)
  const [newFn, setNewFn] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/api/members/').then((r) => r.data),
  })

  const updateFunction = async () => {
    if (!selected || !newFn) return
    setSaving(true)
    try {
      await api.patch(`/api/members/${selected.id}/`, { function: newFn })
      qc.invalidateQueries({ queryKey: ['members'] })
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Admin
          </button>
          <span className="text-gray-700">/</span>
          <h1 className="text-2xl font-extrabold text-white">Members</h1>
        </div>
        <div className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-sm font-bold px-4 py-2 rounded-xl">
          <Users size={16} />
          {members?.length ?? 0} members
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
        {isLoading ? (
          <div className="text-gray-500 text-center py-16 text-sm">Loading members…</div>
        ) : (
          <MemberTable
            members={members ?? []}
            onSelect={(m) => { setSelected(m); setNewFn(m.function) }}
          />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-white text-lg">Edit Member</h2>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800/60 rounded-2xl">
              {selected.profile_picture ? (
                <img src={selected.profile_picture} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                  {selected.full_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-white">{selected.full_name}</p>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Function</label>
            <select
              value={newFn}
              onChange={(e) => setNewFn(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 mb-5"
            >
              {FUNCTIONS.map((fn) => <option key={fn} value={fn}>{fn}</option>)}
            </select>

            <button
              onClick={updateFunction}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-black/30 transition-all"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
