import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, ClipboardList, Pencil, Trash2, Plus,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface CustomQuiz {
  id: number
  function: string
  quiz_title: string
  question_count: number
  created_at: string
}

interface CustomCourse {
  id: number
  function: string
  course_title: string
  course_description: string
  course_url: string
  created_at: string
}

function ConfirmModal({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-white font-semibold text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageContent() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const member = useAuthStore((s) => s.member)
  const posL = member?.position?.toLowerCase() ?? ''
  if (!posL.includes('mc')) return <Navigate to="/" replace />

  const [tab, setTab] = useState<'quizzes' | 'courses'>('quizzes')
  const [expandedFn, setExpandedFn] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'quiz' | 'course'; id: number; title: string } | null>(null)

  const { data: quizzes = [], isLoading: loadingQ } = useQuery<CustomQuiz[]>({
    queryKey: ['manage-quizzes'],
    queryFn: () => api.get('/api/custom-quizzes/').then((r) => r.data),
  })

  const { data: courses = [], isLoading: loadingC } = useQuery<CustomCourse[]>({
    queryKey: ['manage-courses'],
    queryFn: () => api.get('/api/custom-courses/').then((r) => r.data),
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    const url = deleteTarget.type === 'quiz'
      ? `/api/custom-quizzes/${deleteTarget.id}/edit/`
      : `/api/custom-courses/${deleteTarget.id}/`
    await api.delete(url)
    qc.invalidateQueries({ queryKey: [deleteTarget.type === 'quiz' ? 'manage-quizzes' : 'manage-courses'] })
    setDeleteTarget(null)
  }

  const groupBy = <T extends { function: string }>(items: T[]) =>
    items.reduce<Record<string, T[]>>((acc, item) => {
      const key = item.function || 'General'
      acc[key] = acc[key] ? [...acc[key], item] : [item]
      return acc
    }, {})

  const quizGroups = groupBy(quizzes)
  const courseGroups = groupBy(courses)
  const groups = tab === 'quizzes' ? quizGroups : courseGroups
  const isLoading = tab === 'quizzes' ? loadingQ : loadingC

  return (
    <div className="space-y-8">
      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Content</h1>
          <p className="text-gray-500 text-sm mt-1">Edit or delete existing quizzes and courses</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/courses/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white text-sm px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-black/30 transition-all hover:-translate-y-0.5"
          >
            <Plus size={15} /> New Course
          </button>
          <button
            onClick={() => navigate('/admin/quizzes/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white text-sm px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-black/30 transition-all hover:-translate-y-0.5"
          >
            <Plus size={15} /> New Quiz
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl w-fit">
        {(['quizzes', 'courses'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              tab === t
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-gray-500 hover:text-gray-200'
            }`}
          >
            {t === 'quizzes' ? <ClipboardList size={15} /> : <BookOpen size={15} />}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading...</div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900 rounded-3xl border border-dashed border-gray-700">
          <p className="text-gray-400 font-semibold text-lg">No {tab} yet</p>
          <p className="text-gray-600 text-sm mt-1">Create one using the buttons above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([fn, items]) => (
            <div key={fn} className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden">
              {/* Function header — collapsible */}
              <button
                onClick={() => setExpandedFn(expandedFn === fn ? null : fn)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    {fn}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {items.length} {tab === 'quizzes' ? 'quiz' : 'course'}{items.length !== 1 ? (tab === 'quizzes' ? 'zes' : 's') : ''}
                  </span>
                </div>
                {expandedFn === fn
                  ? <ChevronUp size={16} className="text-gray-500" />
                  : <ChevronDown size={16} className="text-gray-500" />}
              </button>

              {/* Rows */}
              {expandedFn === fn && (
                <div className="border-t border-gray-800 divide-y divide-gray-800/60">
                  {items.map((item) => {
                    const title = tab === 'quizzes'
                      ? (item as CustomQuiz).quiz_title
                      : (item as CustomCourse).course_title
                    const sub = tab === 'quizzes'
                      ? `${(item as CustomQuiz).question_count} question${(item as CustomQuiz).question_count !== 1 ? 's' : ''}`
                      : (item as CustomCourse).course_description || (item as CustomCourse).course_url

                    return (
                      <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/20 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                            {tab === 'quizzes'
                              ? <ClipboardList size={16} className="text-indigo-400" />
                              : <BookOpen size={16} className="text-emerald-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{title}</p>
                            <p className="text-gray-500 text-xs truncate max-w-xs">{sub}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className="text-xs text-gray-600 hidden sm:block">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() =>
                              navigate(
                                tab === 'quizzes'
                                  ? `/admin/quizzes/${item.id}/edit`
                                  : `/admin/courses/${item.id}/edit`
                              )
                            }
                            className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: tab === 'quizzes' ? 'quiz' : 'course', id: item.id, title })}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
