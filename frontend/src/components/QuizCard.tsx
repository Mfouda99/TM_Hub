import { ClipboardList, Clock, Target, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { Quiz, QuizAttempt } from '../types'

const FN_GRADIENTS: Record<string, string> = {
  iGV: 'from-blue-500 to-indigo-600', oGV: 'from-indigo-500 to-violet-600',
  iGTa: 'from-violet-500 to-purple-600', oGTa: 'from-purple-500 to-fuchsia-600',
  iGTe: 'from-cyan-400 to-blue-500', oGTe: 'from-teal-400 to-cyan-500',
  MKT: 'from-pink-500 to-rose-600', FIN: 'from-amber-400 to-yellow-500',
  TM: 'from-emerald-400 to-teal-500', BD: 'from-orange-400 to-orange-600',
  PM: 'from-rose-500 to-red-600', ALL: 'from-slate-500 to-slate-600',
  OTHER: 'from-slate-500 to-slate-600',
}

interface Props { quiz: Quiz; bestAttempt?: QuizAttempt; onClick: () => void }

export default function QuizCard({ quiz, bestAttempt, onClick }: Props) {
  const gradient = FN_GRADIENTS[quiz.function] ?? 'from-slate-500 to-slate-600'

  return (
    <div
      onClick={onClick}
      className="group bg-gray-900 border border-gray-800/60 rounded-2xl cursor-pointer hover:bg-gray-800/50 hover:border-gray-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/20`}>
            <ClipboardList size={20} className="text-white" />
          </div>
          {bestAttempt ? (
            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${bestAttempt.passed ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {bestAttempt.passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {bestAttempt.score}%
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 text-gray-500 border border-gray-700">Not taken</span>
          )}
        </div>

        <h3 className="font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors line-clamp-2">{quiz.title}</h3>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-700/50">
            <ClipboardList size={12} /> {quiz.question_count} questions
          </span>
          {quiz.time_limit_minutes && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-700/50">
              <Clock size={12} /> {quiz.time_limit_minutes} min
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-700/50">
            <Target size={12} /> Pass: {quiz.passing_score}%
          </span>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-800/40 border-t border-gray-800 flex items-center justify-between">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>{quiz.function}</span>
        <ChevronRight size={16} className="text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}
