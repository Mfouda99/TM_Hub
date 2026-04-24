import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import ResultModal from '../components/ResultModal'
import { Quiz, SubmitResult } from '../types'

export default function QuizDetail() {
  const { id, fn } = useParams()
  const [searchParams] = useSearchParams()
  const isCustom = (searchParams.get('custom') || '') === '1' || (searchParams.get('custom') || '').toLowerCase() === 'true'
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    const path = isCustom ? `/api/custom-quizzes/${id}/` : `/api/quizzes/${id}/`
    api.get(path)
      .then((r) => {
        const q = r.data as Quiz
        if ((q as any)._custom) {
          ;(q as any)._custom = true
        }
        setQuiz(q)
        setSecondsLeft(q.time_limit_minutes ? q.time_limit_minutes * 60 : null)
      })
      .catch((e) => {
        setError('Could not load quiz')
      })
      .finally(() => setLoading(false))
  }, [id, isCustom])

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) { handleSubmit(); return }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  const handleSubmit = useCallback(async () => {
    if (!quiz) return
    setSubmitting(true)
    try {
      const base = (quiz as any)._custom ? '/api/custom-quizzes' : '/api/quizzes'
      const res = await api.post(`${base}/${quiz.id}/submit/`, { answers })
      setResult(res.data)
    } finally {
      setSubmitting(false)
    }
  }, [quiz, answers])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (loading) return <div className="p-8 text-center">Loading…</div>
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>
  if (!quiz) return <div className="p-8 text-center">Quiz not found</div>

  const questions = quiz.questions || []
  const q = questions[current]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{quiz.title}</h1>
            <p className="text-xs text-gray-400">{quiz.function}</p>
          </div>
        </div>
        <div>
          {secondsLeft !== null && (
            <span className={`flex items-center gap-1 font-mono text-sm ${secondsLeft < 60 ? 'text-red-400' : 'text-gray-300'}`}>
              <Clock size={14} /> {fmt(secondsLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < current ? 'bg-blue-500' : i === current ? 'bg-blue-400' : 'bg-gray-700'}`} />
          ))}
        </div>

        <p className="text-white text-base font-medium mb-5">{q?.text}</p>

        <div className="space-y-3 mb-6">
          {q?.choices?.map((choice: any) => {
            const selected = answers[String(q.id)] === String(choice.id)
            return (
              <button
                key={choice.id}
                onClick={() => setAnswers((a) => ({ ...a, [String(q.id)]: String(choice.id) }))}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                  selected
                    ? 'border-blue-500 bg-blue-600/20 text-white'
                    : 'border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                }`}
              >
                {choice.text}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => c - 1)}
            disabled={current === 0}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>

      {result && <ResultModal result={result} passingScore={quiz.passing_score} onClose={() => navigate(-1)} />}
    </div>
  )
}
