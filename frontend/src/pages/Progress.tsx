import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { DashboardData } from '../types'
import ProgressRing from '../components/ProgressRing'
import SkeletonCard from '../components/SkeletonCard'

export default function Progress() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard/').then((r) => r.data),
  })

  const progress = data?.progress ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Progress</h1>
      <p className="text-gray-400 text-sm mb-6">Your course completion status</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard count={6} />
        </div>
      ) : progress.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-1">No courses started yet</p>
          <p className="text-sm">Visit the Courses tab to begin learning</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.map((p) => (
            <div key={p.id} className="bg-gray-800 rounded-xl p-6 flex items-center gap-5">
              <ProgressRing percent={p.progress_percent} size={80} />
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{p.course_title}</h3>
                <p className={`text-sm mt-0.5 ${p.completed ? 'text-green-400' : 'text-gray-400'}`}>
                  {p.completed ? '✓ Completed' : 'In Progress'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last accessed: {new Date(p.last_accessed).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
