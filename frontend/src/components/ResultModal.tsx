import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { SubmitResult } from '../types'

interface Props {
  result: SubmitResult
  passingScore: number
  onClose: () => void
}

export default function ResultModal({ result, passingScore, onClose }: Props) {
  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-950/45 backdrop-blur-2xl backdrop-brightness-75 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        {result.passed ? (
          <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        ) : (
          <XCircle size={64} className="text-red-400 mx-auto mb-4" />
        )}

        <h2 className={`text-2xl font-bold mb-1 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
          {result.passed ? 'Passed!' : 'Not Passed'}
        </h2>

        <div className="text-5xl font-bold text-white my-4">{result.score}%</div>

        <p className="text-gray-400 text-sm mb-4">
          {result.correct_count} / {result.total} correct · Pass mark: {passingScore}%
        </p>

        {result.per_question && result.per_question.length > 0 && (
          <div className="text-left mb-4 max-h-64 overflow-auto space-y-4">
            {result.per_question.map((pq, idx) => (
              <div key={idx} className="bg-gray-800/60 rounded-lg p-3 border border-gray-800">
                <div className="text-sm font-medium text-gray-200 mb-2">{pq.text}</div>
                <div className="space-y-2">
                  {(pq.choices || []).map((ch: any) => (
                    <div
                      key={String(ch.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded ${ch.is_correct ? 'bg-green-700/10 border border-green-600' : 'border border-gray-700'} ${ch.is_selected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="text-sm text-gray-200">{ch.text}</div>
                      <div className="text-xs flex items-center gap-2">
                        {ch.is_correct && <span className="text-green-300 font-medium">Correct</span>}
                        {ch.is_selected && <span className="text-blue-300 font-medium">Your answer</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium w-full"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  )
}
