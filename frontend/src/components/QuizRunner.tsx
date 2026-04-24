import { useState, useEffect, useCallback } from 'react'
import { X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Quiz, SubmitResult } from '../types'
import api from '../api/axios'
import ResultModal from './ResultModal'

interface Props {
  quiz: Quiz
  onClose: () => void
}

export default function QuizRunner({ quiz, onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(
    quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const questions = quiz.questions

  const submit = useCallback(async () => {
    setSubmitting(true)
    try {
      const base = (quiz as any)._custom ? '/api/custom-quizzes' : '/api/quizzes'
      const res = await api.post(`${base}/${quiz.id}/submit/`, { answers })
      setResult(res.data)
    } finally {
      setSubmitting(false)
    }
  }, [quiz.id, answers])

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) { submit(); return }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, submit])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const q = questions[current]

  if (!q) return null

  return (
    <>
      <div className="fixed inset-0  backdrop-blur- z-50 flex items-center justify-center p-4 h-[60vh]" onClick={onClose}>
        <div
          className="bg-gray-900 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-auto mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div>
              <h2 className="font-bold text-white">{quiz.title}</h2>
              <p className="text-sm text-gray-400">
                Question {current + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {secondsLeft !== null && (
                <span className={`flex items-center gap-1 font-mono text-sm ${secondsLeft < 60 ? 'text-red-400' : 'text-gray-300'}`}>
                  <Clock size={14} /> {fmt(secondsLeft)}
                </span>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < current ? 'bg-blue-500' : i === current ? 'bg-blue-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <p className="text-white text-base font-medium mb-5">{q.text}</p>

            <div className="space-y-3">
              {q.choices.map((choice) => {
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
          </div>

          <div className="flex items-center justify-between p-5 border-t border-gray-800">
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
                onClick={submit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>

      {result && (
        <ResultModal result={result} passingScore={quiz.passing_score} onClose={onClose} />
      )}
    </>
  )
}
