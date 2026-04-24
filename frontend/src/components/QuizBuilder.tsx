import { useState } from 'react'
import { Plus, Trash2, CheckCircle } from 'lucide-react'

export interface QuestionDraft {
  text: string
  question_type: 'MCQ' | 'TF'
  order: number
  choices: { text: string; is_correct: boolean }[]
}

interface Props {
  questions: QuestionDraft[]
  onChange: (qs: QuestionDraft[]) => void
}

export default function QuizBuilder({ questions, onChange }: Props) {
  const addQuestion = (type: 'MCQ' | 'TF') => {
    const q: QuestionDraft = {
      text: '',
      question_type: type,
      order: questions.length,
      choices:
        type === 'TF'
          ? [{ text: 'True', is_correct: true }, { text: 'False', is_correct: false }]
          : [{ text: '', is_correct: true }, { text: '', is_correct: false }],
    }
    onChange([...questions, q])
  }

  const updateQ = (i: number, patch: Partial<QuestionDraft>) => {
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))
  }

  const removeQ = (i: number) => onChange(questions.filter((_, idx) => idx !== i))

  const updateChoice = (qi: number, ci: number, patch: Partial<QuestionDraft['choices'][0]>) => {
    const choices = questions[qi].choices.map((c, idx) => (idx === ci ? { ...c, ...patch } : c))
    updateQ(qi, { choices })
  }

  const setCorrect = (qi: number, ci: number) => {
    const choices = questions[qi].choices.map((c, idx) => ({ ...c, is_correct: idx === ci }))
    updateQ(qi, { choices })
  }

  const addChoice = (qi: number) => {
    if (questions[qi].choices.length >= 6) return
    updateQ(qi, { choices: [...questions[qi].choices, { text: '', is_correct: false }] })
  }

  const removeChoice = (qi: number, ci: number) => {
    if (questions[qi].choices.length <= 2) return
    updateQ(qi, { choices: questions[qi].choices.filter((_, idx) => idx !== ci) })
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
              Q{qi + 1} · {q.question_type}
            </span>
            <button onClick={() => removeQ(qi)} className="text-gray-500 hover:text-red-400">
              <Trash2 size={16} />
            </button>
          </div>

          <textarea
            placeholder="Question text…"
            value={q.text}
            onChange={(e) => updateQ(qi, { text: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 resize-none mb-4"
            rows={2}
          />

          <div className="space-y-2">
            {q.choices.map((c, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <button
                  onClick={() => q.question_type !== 'TF' && setCorrect(qi, ci)}
                  className={`shrink-0 ${c.is_correct ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                  title="Mark as correct"
                >
                  <CheckCircle size={18} />
                </button>
                {q.question_type === 'TF' ? (
                  <span className="flex-1 text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">{c.text}</span>
                ) : (
                  <input
                    placeholder={`Choice ${ci + 1}`}
                    value={c.text}
                    onChange={(e) => updateChoice(qi, ci, { text: e.target.value })}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
                  />
                )}
                {q.question_type === 'MCQ' && q.choices.length > 2 && (
                  <button onClick={() => removeChoice(qi, ci)} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {q.question_type === 'MCQ' && q.choices.length < 6 && (
            <button
              onClick={() => addChoice(qi)}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus size={14} /> Add choice
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={() => addQuestion('MCQ')}
          className="flex-1 border border-dashed border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} /> MCQ Question
        </button>
        <button
          onClick={() => addQuestion('TF')}
          className="flex-1 border border-dashed border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} /> True/False
        </button>
      </div>
    </div>
  )
}
