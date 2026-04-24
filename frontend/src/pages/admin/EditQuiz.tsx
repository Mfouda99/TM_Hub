import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Plus, Trash2,
  Globe, Users, Briefcase, TrendingUp, DollarSign, Sparkles, Heart, Star, Layers, BookOpen,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

const FUNCTIONS = [
  { key: 'OGV', label: 'OGV', subtitle: 'Outgoing Global Volunteer', icon: Globe,      from: 'from-blue-500',    to: 'to-indigo-600'  },
  { key: 'OGT', label: 'OGT', subtitle: 'Outgoing Global Talent',    icon: Star,       from: 'from-cyan-400',    to: 'to-blue-500'    },
  { key: 'IGV', label: 'IGV', subtitle: 'Incoming Global Volunteer', icon: Heart,      from: 'from-violet-500',  to: 'to-purple-600'  },
  { key: 'IGT', label: 'IGT', subtitle: 'Incoming Global Talent',    icon: Users,      from: 'from-purple-500',  to: 'to-fuchsia-600' },
  { key: 'B2C', label: 'B2C', subtitle: 'Business to Customer',      icon: TrendingUp, from: 'from-pink-500',    to: 'to-rose-600'    },
  { key: 'B2B', label: 'B2B', subtitle: 'Business to Business',      icon: Briefcase,  from: 'from-rose-500',    to: 'to-red-600'     },
  { key: 'BD',  label: 'BD',  subtitle: 'Business Development',      icon: Layers,     from: 'from-orange-400',  to: 'to-orange-600'  },
  { key: 'TM',  label: 'TM',  subtitle: 'Talent Management',         icon: Sparkles,   from: 'from-emerald-400', to: 'to-teal-600'    },
  { key: 'F&L', label: 'F&L', subtitle: 'Finance & Legal',           icon: DollarSign, from: 'from-amber-400',   to: 'to-yellow-500'  },
  { key: 'General', label: 'General', subtitle: 'All Functions',     icon: BookOpen,   from: 'from-slate-500',   to: 'to-slate-600'   },
]

interface QuestionDraft {
  text: string
  choices: string[]
  correct: number
}

function makeQuestion(): QuestionDraft {
  return { text: '', choices: ['', '', '', ''], correct: 0 }
}

export default function EditQuiz() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const member = useAuthStore((s) => s.member)

  const [loading, setLoading] = useState(true)
  const [selectedFn, setSelectedFn] = useState<string>('General')
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const posL = member?.position?.toLowerCase() ?? ''
  if (!posL.includes('mc')) return <Navigate to="/" replace />

  useEffect(() => {
    api.get(`/api/custom-quizzes/${id}/`).then((r) => {
      const d = r.data
      setTitle(d.title || d.quiz_title || '')
      setSelectedFn(d.function || 'General')
      const qs: QuestionDraft[] = (d.questions || []).map((q: any, i: number) => {
        const choices: string[] = (q.choices || []).map((c: any) =>
          typeof c === 'string' ? c : (c.text || '')
        )
        const answersMap: Record<string, number> = d.answers || {}
        const correct = answersMap[String(i)] ?? 0
        return { text: q.text || '', choices, correct }
      })
      setQuestions(qs.length ? qs : [makeQuestion()])
    }).catch(() => setError('Failed to load quiz')).finally(() => setLoading(false))
  }, [id])

  const setQText = (qi: number, text: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, text } : q)))

  const setChoice = (qi: number, ci: number, text: string) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? text : c)) } : q
      )
    )

  const addChoice = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, choices: [...q.choices, ''] } : q))
    )

  const removeChoice = (qi: number, ci: number) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q
        const choices = q.choices.filter((_, j) => j !== ci)
        return { ...q, choices, correct: Math.min(q.correct, choices.length - 1) }
      })
    )

  const setCorrect = (qi: number, ci: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, correct: ci } : q)))

  const addQuestion = () => setQuestions((qs) => [...qs, makeQuestion()])

  const removeQuestion = (qi: number) =>
    setQuestions((qs) => qs.filter((_, i) => i !== qi))

  const submit = async () => {
    setError('')
    if (!title.trim()) { setError('Quiz title is required'); return }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) { setError(`Question ${i + 1} is missing its text`); return }
      if (questions[i].choices.some((c) => !c.trim())) { setError(`Question ${i + 1} has an empty choice`); return }
      if (questions[i].choices.length < 2) { setError(`Question ${i + 1} needs at least 2 choices`); return }
    }
    setSaving(true)
    try {
      const questionsPayload = questions.map(({ text, choices }) => ({ text, choices }))
      const answersPayload: Record<string, number> = {}
      questions.forEach((q, i) => { answersPayload[String(i)] = q.correct })
      await api.patch(`/api/custom-quizzes/${id}/edit/`, {
        function: selectedFn,
        quiz_title: title,
        questions: questionsPayload,
        answers: answersPayload,
      })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  const meta = FUNCTIONS.find((f) => f.key === selectedFn) ?? FUNCTIONS[0]
  const MetaIcon = meta.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-500">Loading quiz...</div>
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
          <h2 className="text-2xl font-extrabold text-white mb-2">Quiz Updated!</h2>
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
          <h1 className="text-2xl font-extrabold text-white">Edit Quiz</h1>
          <p className="text-gray-500 text-sm">Update the quiz content and settings</p>
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
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quiz Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
          placeholder="e.g. OGV Fundamentals Q2 2026"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question {qi + 1}</span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              value={q.text}
              onChange={(e) => setQText(qi, e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all mb-4"
              placeholder="Enter your question…"
            />
            <div className="space-y-2">
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={q.correct === ci}
                    onChange={() => setCorrect(qi, ci)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                  />
                  <input
                    value={c}
                    onChange={(e) => setChoice(qi, ci, e.target.value)}
                    className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
                    placeholder={`Choice ${ci + 1}`}
                  />
                  {q.choices.length > 2 && (
                    <button
                      onClick={() => removeChoice(qi, ci)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {q.choices.length < 6 && (
              <button
                onClick={() => addChoice(qi)}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                <Plus size={13} /> Add choice
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-indigo-500/50 text-gray-500 hover:text-indigo-400 py-4 rounded-2xl text-sm font-semibold transition-all"
      >
        <Plus size={16} /> Add Question
      </button>

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
