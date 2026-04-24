import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, ClipboardList, BarChart2, Plus, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'
import MemberTable from '../../components/MemberTable'

interface AdminDashboard {
  total_members: number
  active_courses: number
  total_quizzes_taken: number
  avg_score_per_function: Record<string, number>
  members: any[]
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'stats' | 'members'>('stats')

  const { data, isLoading } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/dashboard/admin/').then((r) => r.data),
  })

  const chartData = Object.entries(data?.avg_score_per_function ?? {}).map(([fn, score]) => ({
    function: fn, score,
  }))

  const stats = [
    { icon: Users, label: 'Total Members', value: data?.total_members ?? 0, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-100' },
    { icon: BookOpen, label: 'Active Courses', value: data?.active_courses ?? 0, gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-100' },
    { icon: ClipboardList, label: 'Quizzes Taken', value: data?.total_quizzes_taken ?? 0, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-100' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage courses, quizzes, and members</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/courses/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white text-sm px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-black/30 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Course
          </button>
          <button
            onClick={() => navigate('/admin/quizzes/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white text-sm px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-black/30 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Quiz
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map(({ icon: Icon, label, value, gradient, shadow }) => (
          <div key={label} className={`bg-gray-900 border border-gray-800/60 rounded-2xl p-6 transition-shadow`}>
            <div className="flex items-center gap-4">
              <div className={`w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <p className="text-3xl font-extrabold text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl w-fit">
        {(['stats', 'members'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-gray-500 hover:text-gray-200'
            }`}
          >
            {t === 'stats' ? <><BarChart2 size={15} /> Stats</> : <><Users size={15} /> Members</>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' ? (
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <h2 className="font-bold text-white text-lg">Average Score per Function</h2>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Loading…</div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="function" stroke="#4b5563" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis stroke="#4b5563" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Avg Score']}
                />
                <Bar dataKey="score" fill="url(#grad)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
          <MemberTable members={data?.members ?? []} />
        </div>
      )}
    </div>
  )
}
