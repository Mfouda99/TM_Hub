import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle,
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
  { key: 'TM',      label: 'TM',      subtitle: 'Talent Management',         icon: Sparkles,   from: 'from-emerald-400', to: 'to-teal-600'    },
  { key: 'F&L',     label: 'F&L',     subtitle: 'Finance & Legal',           icon: DollarSign, from: 'from-amber-400',   to: 'to-yellow-500'  },
  { key: 'General', label: 'General', subtitle: 'All Functions',             icon: BookOpen,   from: 'from-slate-500',   to: 'to-slate-600'   },
]

export default function EditCourse() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const member = useAuthStore((s) => s.member)

  const [loading, setLoading] = useState(true)
  const [selectedFn, setSelectedFn] = useState<string>('General')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const posL = member?.position?.toLowerCase() ?? ''
  if (!posL.includes('mc')) return <Navigate to="/" replace />

  useEffect(() => {
    api.get(`/api/custom-courses/${id}/`).then((r) => {
      const d = r.data
      setTitle(d.course_title || '')
      setDescription(d.course_description || '')
      setUrl(d.course_url || '')
      setSelectedFn(d.function || 'General')
    }).catch(() => setError('Failed to load course')).finally(() => setLoading(false))
  }, [id])

  const submit = async () => {
    setError('')
    if (!title.trim()) { setError('Course title is required'); return }
    if (!url.trim()) { setError('Course URL is required'); return }
    setSaving(true)
    try {
      await api.patch(`/api/custom-courses/${id}/`, {
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

  const meta = FUNCTIONS.find((f) => f.key === selectedFn) ?? FUNCTIONS[0]
  const MetaIcon = meta.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-500">Loading course...</div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Course Updated!</h2>
          <p className="text-gray-400 mb-8">Your changes have been saved.</p>
          <button
            onClick={() => navigate('/admin/manage')}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold text-sm transition-all"
          >
            Back to Manage Content
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/admin/manage')}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Back to Manage Content
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg shadow-black/30`}>
          <MetaIcon size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Edit Course</h1>
          <p className="text-gray-500 text-sm">Update the course details and link</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-4 py-3 font-medium">
          {error}
        </div>
      )}

      {/* Function selector */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Function</label>
        <div className="flex flex-wrap gap-2">
          {FUNCTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedFn(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedFn === f.key
                  ? `bg-gradient-to-r ${f.from} ${f.to} text-white border-transparent`
                  : 'text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Course Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
          placeholder="e.g. OGV Fundamentals Q2 2026"
        />
      </div>

      {/* Description */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Description</label>
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
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Course URL *</label>
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
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
