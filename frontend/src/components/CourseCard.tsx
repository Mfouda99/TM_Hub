import {
  BookOpen, Globe, Users, Briefcase, TrendingUp, DollarSign,
  Sparkles, Heart, Star, Layers, ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { CustomCourse } from '../types'

const FN_META: Record<string, { from: string; to: string; icon: React.ElementType }> = {
  OGV:     { from: 'from-blue-500',    to: 'to-indigo-600',   icon: Globe },
  OGT:     { from: 'from-cyan-400',    to: 'to-blue-500',     icon: Star },
  IGV:     { from: 'from-violet-500',  to: 'to-purple-600',   icon: Heart },
  IGT:     { from: 'from-purple-500',  to: 'to-fuchsia-600',  icon: Users },
  B2C:     { from: 'from-pink-500',    to: 'to-rose-600',     icon: TrendingUp },
  B2B:     { from: 'from-rose-500',    to: 'to-red-600',      icon: Briefcase },
  BD:      { from: 'from-orange-400',  to: 'to-orange-600',   icon: Layers },
  TM:     { from: 'from-emerald-400', to: 'to-teal-600',     icon: Sparkles },
  'F&L':   { from: 'from-amber-400',   to: 'to-yellow-500',   icon: DollarSign },
  General: { from: 'from-slate-500',   to: 'to-slate-600',    icon: BookOpen },
}

interface Props { course: CustomCourse }

export default function CourseCard({ course }: Props) {
  const meta = FN_META[course.function] ?? { from: 'from-blue-500', to: 'to-indigo-600', icon: BookOpen }
  const Icon = meta.icon

  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)

  const handleClick = () => {
    // No-op: opening the course is only allowed via the Open Course button
  }

  useEffect(() => {
    let mounted = true
    api.get(`/api/custom-courses/${course.id}/enroll/`)
      .then((res) => {
        if (!mounted) return
        setEnrolled(Boolean(res.data?.enrolled))
      })
      .catch(() => {
        // ignore errors on status check
      })
    return () => { mounted = false }
  }, [course.id])

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (enrolling || enrolled) return
    setEnrolling(true)
    try {
      await api.post(`/api/custom-courses/${course.id}/enroll/`)
      setEnrolled(true)
      alert('Enrolled successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.status || 'Enrollment failed'
      alert(msg)
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-gray-900 border border-gray-800/60 rounded-2xl cursor-pointer hover:bg-gray-800/50 hover:border-gray-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center shadow-lg shadow-black/30`}>
            <Icon size={20} className="text-white" />
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
            {course.function || 'General'}
          </span>
        </div>

        <h3 className="font-bold text-white mb-1.5 line-clamp-2 group-hover:text-indigo-400 transition-colors">
          {course.course_title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {course.course_description}
        </p>
      </div>

      <div className="px-6 py-3 bg-gray-800/40 border-t border-gray-800 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500 font-medium">
          {new Date(course.created_at).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-3">
          {!enrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className={`text-sm font-semibold px-3 py-1 rounded-xl transition-colors bg-indigo-600 hover:bg-indigo-500 text-white`}
            >
              {enrolling ? 'Enrolling…' : 'Enroll'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                disabled
                className="text-sm font-semibold px-3 py-1 rounded-xl bg-green-600 text-white"
              >
                Enrolled
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(course.course_url, '_blank', 'noopener,noreferrer') }}
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                Open Course <ChevronRight size={14} className="inline-block" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
