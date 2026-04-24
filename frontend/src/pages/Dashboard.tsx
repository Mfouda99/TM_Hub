import { useQuery } from '@tanstack/react-query'
import { BookOpen, ClipboardList, TrendingUp, Award, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { DashboardData } from '../types'
import SkeletonCard from '../components/SkeletonCard'

const FN_COLORS: Record<string, string> = {
  OGV: 'from-blue-500 to-indigo-600',
  OGT: 'from-cyan-400 to-blue-500',
  IGV: 'from-violet-500 to-purple-600',
  IGT: 'from-purple-500 to-fuchsia-600',
  B2C: 'from-pink-500 to-rose-600',
  B2B: 'from-rose-500 to-red-600',
  BD: 'from-orange-400 to-orange-600',
  TM: 'from-emerald-400 to-teal-600',
  'F&L': 'from-amber-400 to-yellow-500',
  General: 'from-slate-500 to-slate-600',
}

function fnGradient(fn: string) {
  return FN_COLORS[fn] ?? 'from-indigo-500 to-violet-600'
}

function StatCard({ icon: Icon, label, value, color, gradient }: {
  icon: React.ElementType; label: string; value: number | string; color: string; gradient: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 relative overflow-hidden hover:bg-gray-800/50 hover:border-gray-700 hover:shadow-lg transition-all duration-500 hover:-translate-y-1 group cursor-default">
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${color} opacity-10 group-hover:scale-150 transition-transform duration-700 blur-2xl`}></div>
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-300`}>
          <Icon size={26} className="text-white" />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const member = useAuthStore((s) => s.member)

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/').then((r) => r.data),
  })

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Header */}
      <div className="bg-gradient-to-tr from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute right-10 top-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute right-40 bottom-10 w-48 h-48 bg-indigo-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative group">
            {member?.profile_picture ? (
              <img src={member.profile_picture} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white/20 shadow-xl group-hover:ring-blue-400 transition-colors duration-500" alt="" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-3xl shadow-xl ring-4 ring-white/20 group-hover:ring-blue-400 transition-colors duration-500">
                {member?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 p-2 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{member?.full_name?.split(' ')[0] || 'Member'}</span> 👋
            </h1>
            <p className="text-slate-300 font-medium flex-wrap flex items-center gap-2 mt-3">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs uppercase tracking-widest backdrop-blur-sm border border-white/5 shadow-sm text-white">{member?.home_lc || 'Global'}</span>
              <span className="text-slate-400 hidden sm:inline">·</span>
              <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-3 py-1 rounded-full text-xs uppercase tracking-widest backdrop-blur-sm border border-blue-400/20 text-blue-100 shadow-inner">
                {member?.position || member?.function}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon={BookOpen}      label="Courses Enrolled" value={data?.courses_enrolled ?? 0} color="bg-blue-500"    gradient="from-blue-500 to-cyan-500" />
          <StatCard icon={ClipboardList} label="Quizzes Taken"    value={data?.quizzes_taken ?? 0}    color="bg-purple-500"  gradient="from-purple-500 to-pink-500" />
          <StatCard icon={TrendingUp}    label="Avg Score"        value={`${data?.avg_score ?? 0}%`}  color="bg-emerald-500" gradient="from-emerald-400 to-teal-500" />
          <StatCard icon={Award}         label="Quizzes Passed"   value={data?.passed_count ?? 0}     color="bg-amber-500"   gradient="from-amber-400 to-orange-500" />
        </div>
      )}

      {/* Recent Quizzes & Recent Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Quizzes */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-8 hover:bg-gray-800/50 hover:border-gray-700 transition-all duration-300">
          <h2 className="text-xl font-bold border-b-2 border-indigo-500 pb-1 pr-4 inline-block text-white mb-8">Recent Quizzes</h2>
          {isLoading ? (
            <div className="space-y-3"><SkeletonCard count={3} /></div>
          ) : data?.recent_quizzes?.length ? (
            <div className="space-y-3">
              {data.recent_quizzes.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-800/40 border border-transparent hover:border-gray-700 transition-colors group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${fnGradient(q.function)} text-white`}>
                      {q.function || '—'}
                    </span>
                    <p className="text-sm text-gray-200 font-semibold truncate group-hover:text-indigo-400 transition-colors">
                      {q.quiz_title}
                    </p>
                  </div>
                  <div className="shrink-0 text-right ml-4">
                    <p className={`font-bold text-lg ${q.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                      {q.score}%
                    </p>
                    <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${q.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {q.passed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-800/40 rounded-3xl border border-dashed border-gray-700">
              <ClipboardList className="mx-auto h-12 w-12 text-indigo-500 mb-3" />
              <p className="font-bold text-gray-400">No quizzes taken yet</p>
              <p className="text-sm mt-1 text-gray-500">Head to the Quizzes page to get started!</p>
            </div>
          )}
        </div>

        {/* Recent Enrolled Courses */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-8 hover:bg-gray-800/50 hover:border-gray-700 transition-all duration-300">
          <h2 className="text-xl font-bold border-b-2 border-blue-500 pb-1 pr-4 inline-block text-white mb-8">Enrolled Courses</h2>
          {isLoading ? (
            <div className="space-y-3"><SkeletonCard count={3} /></div>
          ) : data?.recent_courses?.length ? (
            <div className="space-y-3">
              {data.recent_courses.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-800/40 border border-transparent hover:border-gray-700 transition-colors group cursor-default">
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${fnGradient(c.function)} text-white`}>
                    {c.function || '—'}
                  </span>
                  <p className="text-sm text-gray-200 font-semibold truncate group-hover:text-indigo-400 transition-colors flex-1">
                    {c.course_title}
                  </p>
                  <p className="text-xs text-gray-600 shrink-0">
                    {new Date(c.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-800/40 rounded-3xl border border-dashed border-gray-700">
              <BookOpen className="mx-auto h-12 w-12 text-blue-500 mb-3" />
              <p className="font-bold text-gray-400">No courses enrolled yet</p>
              <p className="text-sm mt-1 text-gray-500">Browse the Courses page to enroll!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
