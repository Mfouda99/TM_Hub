import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, ChevronRight,
  Globe, Users, Briefcase, TrendingUp, DollarSign, Sparkles, Heart, Star, Layers, BookOpen,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

const FUNCTIONS = [
  { key: 'OGV',     label: 'OGV',     subtitle: 'Outgoing Global Volunteer', icon: Globe,      from: 'from-blue-500',    to: 'to-indigo-600'  },
  { key: 'OGT',     label: 'OGT',     subtitle: 'Outgoing Global Talent',    icon: Star,       from: 'from-cyan-400',    to: 'to-blue-500'    },
  { key: 'IGV',     label: 'IGV',     subtitle: 'Incoming Global Volunteer', icon: Heart,      from: 'from-violet-500',  to: 'to-purple-600'  },
  { key: 'IGT',     label: 'IGT',     subtitle: 'Incoming Global Talent',    icon: Users,      from: 'from-purple-500',  to: 'to-fuchsia-600' },
  { key: 'B2C',     label: 'B2C',     subtitle: 'Business to Customer',      icon: TrendingUp, from: 'from-pink-500',    to: 'to-rose-600'    },
  { key: 'B2B',     label: 'B2B',     subtitle: 'Business to Business',      icon: Briefcase,  from: 'from-rose-500',    to: 'to-red-600'     },
  { key: 'BD',      label: 'BD',      subtitle: 'Business Development',      icon: Layers,     from: 'from-orange-400',  to: 'to-orange-600'  },
  { key: 'TM',     label: 'TM',     subtitle: 'Talent management',         icon: Sparkles,   from: 'from-emerald-400', to: 'to-teal-600'    },
  { key: 'F&L',     label: 'F&L',     subtitle: 'Finance & Legal',           icon: DollarSign, from: 'from-amber-400',   to: 'to-yellow-500'  },
  { key: 'General', label: 'General', subtitle: 'All Functions',             icon: BookOpen,   from: 'from-slate-500',   to: 'to-slate-600'   },
]

export default function CourseCreator() {
  const navigate = useNavigate()
  const member = useAuthStore((s) => s.member)

  const [selectedFn, setSelectedFn] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const posL = member?.position?.toLowerCase() ?? ''
  if (!posL.includes('mc')) return <Navigate to="/" replace />

  const reset = () => {
    setDone(false); setSelectedFn(null); setTitle(''); setDescription(''); setUrl('')
  }

  const submit = async () => {
    setError('')
    if (!title.trim()) { setError('Course title is required'); return }
    if (!url.trim()) { setError('Course URL is required'); return }
    setSaving(true)
    try {
      await api.post('/api/custom-courses/', {
        function: selectedFn,
        course_title: title.trim(),
        course_description: description.trim(),
        course_url: url.trim(),
      })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (done) {
    const meta = FUNCTIONS.find((f) => f.key === selectedFn)!
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Course Added!</h2>
          <p className="text-gray-400 mb-2">
            <span className="font-semibold text-white">"{title}"</span>
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Saved for the{' '}
            <span className={`inline-block bg-gradient-to-r ${meta.from} ${meta.to} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
              {selectedFn}
            </span>{' '}
            function.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              Add Another
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Function Picker ───────────────────────────────────────────────────────
  if (!selectedFn) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium mb-10 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Add a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              New Course
            </span>
          </h1>
          <p className="text-gray-500 text-base">Select the function this course belongs to</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {FUNCTIONS.map(({ key, label, subtitle, icon: Icon, from, to }) => (
            <button
              key={key}
              onClick={() => setSelectedFn(key)}
              className={`group relative bg-gradient-to-br ${from} ${to} rounded-2xl p-6 text-white text-left transition-all duration-300 shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1.5 overflow-hidden`}
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

  // ── Course Form ───────────────────────────────────────────────────────────
  const meta = FUNCTIONS.find((f) => f.key === selectedFn)!
  const Icon = meta.icon

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setSelectedFn(null)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Change function
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg shadow-black/30`}>
          <Icon size={26} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`bg-gradient-to-r ${meta.from} ${meta.to} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
              {selectedFn}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Add a Course</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-4 py-3 mb-5 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Course Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
            placeholder={`e.g. ${selectedFn} Fundamentals Q2 2026`}
          />
        </div>

        {/* Description */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none placeholder-gray-500 transition-all"
            placeholder="Describe what members will learn…"
          />
        </div>

        {/* URL */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Course URL *
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
            placeholder="https://drive.google.com/…"
          />
          <p className="text-xs text-gray-600 mt-2">Google Drive, PDF link, or any direct URL</p>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className={`w-full bg-gradient-to-r ${meta.from} ${meta.to} hover:opacity-90 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5`}
        >
          {saving ? 'Saving…' : `Save ${selectedFn} Course`}
        </button>
      </div>
    </div>
  )
}
