import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle } from 'lucide-react'
import api from '../api/axios'
import { DashboardData } from '../types'
import ScoreChart from '../components/ScoreChart'
import SkeletonCard from '../components/SkeletonCard'

export default function Scores() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/').then((r) => r.data),
  })

  const attempts = data?.recent_attempts ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Scores</h1>

      <div className="bg-gray-800 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">Score Trend</h2>
        <ScoreChart attempts={attempts} />
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">Attempt History</h2>
        </div>

        {isLoading ? (
          <div className="p-5">
            <SkeletonCard count={4} />
          </div>
        ) : attempts.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No quiz attempts yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Quiz</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-center px-5 py-3 text-gray-400 font-medium">Score</th>
                <th className="text-center px-5 py-3 text-gray-400 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                  <td className="px-5 py-3 text-white">{a.quiz_title}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {a.completed_at ? new Date(a.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-center font-bold">
                    <span className={a.passed ? 'text-green-400' : 'text-red-400'}>
                      {a.score ?? '—'}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {a.passed ? (
                      <span className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle size={16} /> Passed
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-red-400">
                        <XCircle size={16} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
