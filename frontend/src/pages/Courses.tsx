import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Globe, Users, Briefcase, TrendingUp, DollarSign, Sparkles,
  Heart, Star, Layers, BookOpen, ArrowLeft, ChevronRight, Search
} from 'lucide-react'
import api from '../api/axios'
import { CustomCourse } from '../types'
import { useAuthStore } from '../store/authStore'
import CourseCard from '../components/CourseCard'
import SkeletonCard from '../components/SkeletonCard'

const FUNCTION_META = [
  { key: 'OGV', label: 'OGV', subtitle: 'Outgoing Global Volunteer', icon: Globe,       from: 'from-blue-500',    to: 'to-indigo-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-blue-300/60' },
  { key: 'OGT', label: 'OGT', subtitle: 'Outgoing Global Talent',    icon: Star,        from: 'from-cyan-400',    to: 'to-blue-500',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-cyan-300/60' },
  { key: 'IGV', label: 'IGV', subtitle: 'Incoming Global Volunteer', icon: Heart,       from: 'from-violet-500',  to: 'to-purple-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-violet-300/60' },
  { key: 'IGT', label: 'IGT', subtitle: 'Incoming Global Talent',    icon: Users,       from: 'from-purple-500',  to: 'to-fuchsia-600',   shadow: 'shadow-black/30',    glow: 'group-hover:shadow-purple-300/60' },
  { key: 'B2C', label: 'B2C', subtitle: 'Business to Customer',      icon: TrendingUp,  from: 'from-pink-500',    to: 'to-rose-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-pink-300/60' },
  { key: 'B2B', label: 'B2B', subtitle: 'Business to Business',      icon: Briefcase,   from: 'from-rose-500',    to: 'to-red-600',       shadow: 'shadow-black/30',    glow: 'group-hover:shadow-rose-300/60' },
  { key: 'BD',  label: 'BD',  subtitle: 'Business Development',      icon: Layers,      from: 'from-orange-400',  to: 'to-orange-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-orange-300/60' },
  { key: 'TM', label: 'TM', subtitle: 'Talent management',         icon: Sparkles,    from: 'from-emerald-400', to: 'to-teal-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-emerald-300/60' },
  { key: 'F&L', label: 'F&L', subtitle: 'Finance & Legal',           icon: DollarSign,  from: 'from-amber-400',   to: 'to-yellow-500',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'General', label: 'General', subtitle: 'All Functions',     icon: BookOpen,    from: 'from-slate-500',   to: 'to-slate-600',     shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
]

export default function Courses() {
  const member = useAuthStore((s) => s.member)
  const [selectedFn, setSelectedFn] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const posLower = member?.position?.toLowerCase() ?? ''
  const seeAll = posLower.includes('mc') || posLower.includes('lcp') || posLower.includes('president')
  const userFnLower = member?.function?.toLowerCase() ?? ''
  const visibleFunctions = FUNCTION_META.filter(
    (f) => seeAll || f.key === 'General' || f.key.toLowerCase() === userFnLower
  )

  const { data: courses, isLoading } = useQuery<CustomCourse[]>({
    queryKey: ['custom-courses', selectedFn],
    queryFn: () => api.get(`/api/custom-courses/${selectedFn ? `?function=${selectedFn}` : ''}`).then((r) => r.data),
    enabled: !!selectedFn,
  })

  // ── Function picker ─────────────────────────────────────────────────────────
  if (!selectedFn) {
    return (
      <div className="space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Courses
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Select a function to browse its courses
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
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

  const meta = FUNCTION_META.find((f) => f.key === selectedFn)
  const Icon = meta!.icon

  const filtered = (courses ?? []).filter((c) =>
    c.course_title.toLowerCase().includes(search.toLowerCase()) ||
    c.course_description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedFn(null)
              setSearch('')
            }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> All Functions
          </button>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta!.from} ${meta!.to} flex items-center justify-center shadow-md shadow-black/30`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{meta!.label} Courses</h1>
              <p className="text-xs text-gray-400 font-medium">{meta!.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800/80 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full sm:w-60 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900 rounded-3xl border border-dashed border-gray-700">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta!.from} ${meta!.to} flex items-center justify-center mb-4 opacity-20`}>
            <BookOpen size={28} className="text-white" />
          </div>
          <p className="font-bold text-gray-300 text-lg mb-1">
            {search ? 'No courses match your search' : `No courses yet for ${meta!.label}`}
          </p>
          <p className="text-sm text-gray-600">
            {search ? 'Try different keywords' : 'Courses will appear here once added'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
