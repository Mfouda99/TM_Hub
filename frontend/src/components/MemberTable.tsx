import { useState } from 'react'
import { Member } from '../types'

const FUNCTIONS = ['', 'iGV', 'oGV', 'iGTa', 'oGTa', 'iGTe', 'oGTe', 'MKT', 'FIN', 'TM', 'BD', 'PM', 'OTHER']

interface Props {
  members: Member[]
  onSelect?: (m: Member) => void
}

export default function MemberTable({ members, onSelect }: Props) {
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = members.filter((m) => {
    const matchFn = !filter || m.function === filter
    const matchSearch =
      !search ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    return matchFn && matchSearch
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 flex-1 outline-none focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        >
          {FUNCTIONS.map((fn) => (
            <option key={fn} value={fn}>{fn || 'All Functions'}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Member</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Function</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Logins</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Quizzes</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Avg Score</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                onClick={() => onSelect?.(m)}
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${onSelect ? 'cursor-pointer' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.profile_picture ? (
                      <img src={m.profile_picture} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                        {m.full_name?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{m.full_name}</p>
                      <p className="text-gray-500 text-xs">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full">{m.function}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-300">{m.login_count}</td>
                <td className="px-4 py-3 text-center text-gray-300">{m.quizzes_taken ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${(m.avg_score ?? 0) >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.avg_score ?? 0}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-300">{m.course_completion ?? 0}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No members found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
