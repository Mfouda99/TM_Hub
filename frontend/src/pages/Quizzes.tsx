import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Globe, Users, Briefcase, TrendingUp, DollarSign, Sparkles,
  Heart, Star, Layers, BookOpen, ArrowLeft, ClipboardList, ChevronRight,
} from 'lucide-react'
import api from '../api/axios'
import { Quiz, QuizAttempt } from '../types'
import { useAuthStore } from '../store/authStore'
import QuizRunner from '../components/QuizRunner'
import SkeletonCard from '../components/SkeletonCard'

// ── Function meta shared across the app ──────────────────────────────────────
const FUNCTION_META = [
  { key: 'OGV', label: 'OGV', subtitle: 'Outgoing Global Volunteer', icon: Globe,       from: 'from-blue-500',    to: 'to-indigo-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-blue-300/60' },
  { key: 'OGT', label: 'OGT', subtitle: 'Outgoing Global Talent',    icon: Star,        from: 'from-cyan-400',    to: 'to-blue-500',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-cyan-300/60' },
  { key: 'IGV', label: 'IGV', subtitle: 'Incoming Global Volunteer', icon: Heart,       from: 'from-violet-500',  to: 'to-purple-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-violet-300/60' },
  { key: 'IGT', label: 'IGT', subtitle: 'Incoming Global Talent',    icon: Users,       from: 'from-purple-500',  to: 'to-fuchsia-600',   shadow: 'shadow-black/30',    glow: 'group-hover:shadow-purple-300/60' },
  { key: 'B2C', label: 'B2C', subtitle: 'Business to Customer',      icon: TrendingUp,  from: 'from-pink-500',    to: 'to-rose-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-pink-300/60' },
  { key: 'B2B', label: 'B2B', subtitle: 'Business to Business',      icon: Briefcase,   from: 'from-rose-500',    to: 'to-red-600',       shadow: 'shadow-black/30',    glow: 'group-hover:shadow-rose-300/60' },
  { key: 'BD',  label: 'BD',  subtitle: 'Business Development',      icon: Layers,      from: 'from-orange-400',  to: 'to-orange-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-orange-300/60' },
  { key: 'TM', label: 'TM', subtitle: 'Talent management',         icon: Sparkles,    from: 'from-emerald-400', to: 'to-teal-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-emerald-300/60' },
  { key: 'F&L',     label: 'F&L',     subtitle: 'Finance & Legal', icon: DollarSign, from: 'from-amber-400',   to: 'to-yellow-500',  shadow: 'shadow-black/30', glow: 'group-hover:shadow-black/50' },
  { key: 'General', label: 'General', subtitle: 'All Functions',  icon: BookOpen,   from: 'from-slate-500',   to: 'to-slate-600',   shadow: 'shadow-black/30', glow: 'group-hover:shadow-black/50' },
]

// Custom quiz type (from the quizzes table)
interface CustomQuiz {
  id: number
  function: string
  quiz_title: string
  question_count: number
  created_at: string
}

// ── Custom quiz card ──────────────────────────────────────────────────────────
function CustomQuizCard({ quiz, meta, onClick }: { quiz: CustomQuiz; meta: typeof FUNCTION_META[0]; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group bg-gray-900 border border-gray-800/60 rounded-2xl cursor-pointer hover:bg-gray-800/50 hover:border-gray-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg shadow-black/30`}>
            <ClipboardList size={20} className="text-white" />
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${meta.from} ${meta.to} text-white`}>
            {quiz.function}
          </span>
        </div>

        <h3 className="font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
          {quiz.quiz_title}
        </h3>

        <div className="flex items-center gap-2 mt-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-700/50">
            <ClipboardList size={12} className="text-gray-500" />
            {quiz.question_count} question{quiz.question_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-800/40 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">
          {new Date(quiz.created_at).toLocaleDateString()}
        </span>
        <ChevronRight size={16} className="text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}

// ── Main Quizzes page ─────────────────────────────────────────────────────────
export default function Quizzes() {
  const qc = useQueryClient()
  const member = useAuthStore((s) => s.member)
  const [selectedFn, setSelectedFn] = useState<string | null>(null)

  const posLower = member?.position?.toLowerCase() ?? ''
  const seeAll = posLower.includes('mc') || posLower.includes('lcp') || posLower.includes('president')
  const userFnLower = member?.function?.toLowerCase() ?? ''
  const visibleFunctions = FUNCTION_META.filter(
    (f) => seeAll || f.key === 'General' || f.key.toLowerCase() === userFnLower
  )
  const [activeOldQuiz, setActiveOldQuiz] = useState<Quiz | null>(null)
  const navigate = useNavigate()
  const params = useParams()

  // Old-style quizzes (Django model) — still fetched for QuizRunner compatibility
  const { data: oldQuizzes } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: () => api.get('/api/quizzes/').then((r) => r.data),
  })

  const { data: attempts } = useQuery<QuizAttempt[]>({
    queryKey: ['all-attempts'],
    queryFn: async () => {
      if (!oldQuizzes) return []
      const all = await Promise.all(
        oldQuizzes.map((q) => api.get(`/api/quizzes/${q.id}/attempts/`).then((r) => r.data as QuizAttempt[]))
      )
      return all.flat()
    },
    enabled: !!oldQuizzes,
  })

  // Custom quizzes for the selected function
  const { data: customQuizzes, isLoading: loadingCustom } = useQuery<CustomQuiz[]>({
    queryKey: ['custom-quizzes', selectedFn],
    queryFn: () =>
      api.get(`/api/custom-quizzes/${selectedFn ? `?function=${selectedFn}` : ''}`).then((r) => r.data),
    enabled: !!selectedFn,
  })

  const meta = FUNCTION_META.find((f) => f.key === selectedFn)

  // ── Function picker ─────────────────────────────────────────────────────────
  if (!selectedFn) {
    return (
      <div className="space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Quizzes
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Select a function to browse its quizzes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 max-w-3xl mx-auto">
          {visibleFunctions.map(({ key, label, subtitle, icon: Icon, from, to, shadow, glow }) => (
            <button
              key={key}
              onClick={() => setSelectedFn(key)}
              className={`group relative bg-gradient-to-br ${from} ${to} rounded-2xl p-6 text-white text-left transition-all duration-300 shadow-lg ${shadow} hover:shadow-2xl ${glow} hover:-translate-y-1.5 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-2xl font-black tracking-tight mb-1">{label}</p>
                <p className="text-white/70 text-xs font-medium leading-tight">{subtitle}</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                <ChevronRight size={18} className="text-white/80" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Quiz list for selected function ─────────────────────────────────────────
  const Icon = meta!.icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedFn(null)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> All Functions
        </button>
        <span className="text-gray-700">/</span>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta!.from} ${meta!.to} flex items-center justify-center shadow-md shadow-black/30`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{meta!.label} Quizzes</h1>
            <p className="text-xs text-gray-400 font-medium">{meta!.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Quiz grid */}
      {loadingCustom ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={3} />
        </div>
      ) : !customQuizzes || customQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900 rounded-3xl border border-dashed border-gray-700">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta!.from} ${meta!.to} flex items-center justify-center mb-4 opacity-20`}>
            <ClipboardList size={28} className="text-white" />
          </div>
          <p className="font-bold text-gray-400 text-lg mb-1">No quizzes yet for {meta!.label}</p>
          <p className="text-sm text-gray-600">Check back later or ask your MC team to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customQuizzes.map((quiz) => (
            <CustomQuizCard
              key={quiz.id}
              quiz={quiz}
              meta={meta!}
              onClick={() => {
                const routeFn = params.fn || selectedFn || ''
                navigate(`/${routeFn}/quizzes/${quiz.id}?custom=1`)
              }}
            />
          ))}
        </div>
      )}

      {/* Legacy quiz runner */}
      {activeOldQuiz && (
        <QuizRunner
          quiz={activeOldQuiz}
          onClose={() => {
            setActiveOldQuiz(null)
            qc.invalidateQueries({ queryKey: ['all-attempts'] })
          }}
        />
      )}

      {/* custom quizzes open in their own page now */}
    </div>
  )
}
