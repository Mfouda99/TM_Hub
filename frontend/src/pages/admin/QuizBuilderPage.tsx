import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Plus, Trash2, ChevronRight,
  Globe, Users, Briefcase, TrendingUp, DollarSign, Sparkles, Heart, Star, Layers, BookOpen,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

const FUNCTIONS = [
  { key: 'OGV', label: 'OGV', subtitle: 'Outgoing Global Volunteer', icon: Globe,      from: 'from-blue-500',    to: 'to-indigo-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'OGT', label: 'OGT', subtitle: 'Outgoing Global Talent',    icon: Star,       from: 'from-cyan-400',    to: 'to-blue-500',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'IGV', label: 'IGV', subtitle: 'Incoming Global Volunteer', icon: Heart,      from: 'from-violet-500',  to: 'to-purple-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'IGT', label: 'IGT', subtitle: 'Incoming Global Talent',    icon: Users,      from: 'from-purple-500',  to: 'to-fuchsia-600',   shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'B2C', label: 'B2C', subtitle: 'Business to Customer',      icon: TrendingUp, from: 'from-pink-500',    to: 'to-rose-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'B2B', label: 'B2B', subtitle: 'Business to Business',      icon: Briefcase,  from: 'from-rose-500',    to: 'to-red-600',       shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'BD',  label: 'BD',  subtitle: 'Business Development',      icon: Layers,     from: 'from-orange-400',  to: 'to-orange-600',    shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'TM', label: 'TM', subtitle: 'Talent management',         icon: Sparkles,   from: 'from-emerald-400', to: 'to-teal-600',      shadow: 'shadow-black/30',    glow: 'group-hover:shadow-black/50' },
  { key: 'F&L',     label: 'F&L',     subtitle: 'Finance & Legal', icon: DollarSign, from: 'from-amber-400',   to: 'to-yellow-500',  shadow: 'shadow-black/30', glow: 'group-hover:shadow-black/50' },
  { key: 'General', label: 'General', subtitle: 'All Functions',  icon: BookOpen,   from: 'from-slate-500',   to: 'to-slate-600',   shadow: 'shadow-black/30', glow: 'group-hover:shadow-black/50' },
]

interface QuestionDraft {
  text: string
  choices: string[]
  correct: number
}

function makeQuestion(): QuestionDraft {
  return { text: '', choices: ['', '', '', ''], correct: 0 }
}

export default function QuizBuilderPage() {
  const navigate = useNavigate()
  const member = useAuthStore((s) => s.member)

  const [selectedFn, setSelectedFn] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [numQ, setNumQ] = useState(3)
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    Array.from({ length: 3 }, makeQuestion)
  )
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const posL = member?.position?.toLowerCase() ?? ''
  if (!posL.includes('mc')) return <Navigate to="/" replace />

  const changeNumQ = (n: number) => {
    const clamped = Math.max(1, Math.min(50, n))
    setNumQ(clamped)
    setQuestions((prev) =>
      clamped > prev.length
        ? [...prev, ...Array.from({ length: clamped - prev.length }, makeQuestion)]
        : prev.slice(0, clamped)
    )
  }

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

  const reset = () => {
    setDone(false); setSelectedFn(null); setTitle('')
    setQuestions(Array.from({ length: 3 }, makeQuestion)); setNumQ(3)
  }

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
      await api.post('/api/custom-quizzes/', {
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

  // ── Success ───────────────────────────────────────────────────────────────
  if (done) {
    const meta = FUNCTIONS.find((f) => f.key === selectedFn)!
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Quiz Created!</h2>
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
              Create Another
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
              New Quiz
            </span>
          </h1>
          <p className="text-gray-500 text-base">Select the function this quiz belongs to</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {FUNCTIONS.map(({ key, label, subtitle, icon: Icon, from, to, shadow, glow }) => (
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

  // ── Quiz Form ─────────────────────────────────────────────────────────────
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
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg ${meta.shadow}`}>
          <Icon size={26} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`bg-gradient-to-r ${meta.from} ${meta.to} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
              {selectedFn}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Build a Quiz</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-4 py-3 mb-5 font-medium">
          {error}
        </div>
      )}

      {/* Quiz Title */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Quiz Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-gray-500 transition-all"
          placeholder={`e.g. ${selectedFn} Knowledge Check Q2`}
        />
      </div>

      {/* Number of questions */}
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Number of Questions</p>
          <p className="text-xs text-gray-500 mt-0.5">Question slots adjust automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeNumQ(numQ - 1)}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold flex items-center justify-center transition-colors text-lg"
          >
            −
          </button>
          <input
            type="number" min={1} max={50}
            value={numQ}
            onChange={(e) => changeNumQ(Number(e.target.value))}
            className="w-14 text-center bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-white text-sm font-bold outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => changeNumQ(numQ + 1)}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold flex items-center justify-center transition-colors text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {questions.map((q, qi) => (
          <div
            key={qi}
            className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 transition-shadow"
          >
            {/* Question header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-black">{qi + 1}</span>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question {qi + 1}</p>
            </div>

            {/* Question text */}
            <textarea
              value={q.text}
              onChange={(e) => setQText(qi, e.target.value)}
              rows={2}
              placeholder="Type your question here…"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none placeholder-gray-500 transition-all mb-5"
            />

            {/* Choices label */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Answer Choices</p>
              <p className="text-xs text-gray-500">Click <span className="text-green-500 font-semibold">●</span> to mark correct</p>
            </div>

            <div className="space-y-2.5">
              {q.choices.map((choice, ci) => (
                <div key={ci} className="flex items-center gap-3">
                  {/* Correct toggle */}
                  <button
                    type="button"
                    onClick={() => setCorrect(qi, ci)}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 transition-all duration-200 ${
                      q.correct === ci
                        ? 'bg-green-500 border-green-400'
                        : 'border-gray-600 hover:border-green-400 bg-gray-800'
                    }`}
                  />
                  {/* Letter badge */}
                  <span className={`text-xs font-black w-6 text-center shrink-0 ${q.correct === ci ? 'text-indigo-400' : 'text-gray-600'}`}>
                    {String.fromCharCode(65 + ci)}
                  </span>
                  {/* Input */}
                  <input
                    value={choice}
                    onChange={(e) => setChoice(qi, ci, e.target.value)}
                    placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                    className={`flex-1 border rounded-xl px-3 py-2 text-sm outline-none transition-all ${
                      q.correct === ci
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white focus:border-indigo-500 placeholder-gray-600'
                        : 'bg-gray-800/60 border-gray-700 text-gray-200 placeholder-gray-600 focus:border-indigo-500'
                    }`}
                  />
                  {/* Remove */}
                  {q.choices.length > 2 && (
                    <button
                      onClick={() => removeChoice(qi, ci)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {q.choices.length < 6 && (
              <button
                onClick={() => addChoice(qi)}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={14} />
                Add choice
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={saving}
        className={`w-full bg-gradient-to-r ${meta.from} ${meta.to} hover:opacity-90 disabled:opacity-50 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-black/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5`}
      >
        {saving
          ? 'Saving…'
          : `Save ${selectedFn} Quiz · ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
