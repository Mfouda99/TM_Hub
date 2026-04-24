import { useState } from 'react'
import { X, FileText, Video, File, ExternalLink } from 'lucide-react'
import { Course, CourseProgress } from '../types'
import api from '../api/axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface Props {
  course: Course
  progress?: CourseProgress
  onClose: () => void
  onProgressUpdate: () => void
}

export default function CourseDetail({ course, progress, onClose, onProgressUpdate }: Props) {
  const [selected, setSelected] = useState(course.files[0] ?? null)
  const [pct, setPct] = useState(progress?.progress_percent ?? 0)
  const [saving, setSaving] = useState(false)

  const updateProgress = async () => {
    setSaving(true)
    try {
      await api.post(`/api/courses/${course.id}/progress/`, { progress_percent: pct })
      onProgressUpdate()
    } finally {
      setSaving(false)
    }
  }

  const fileUrl = selected ? `${BASE}${selected.file}` : ''

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-lg text-white">{course.title}</h2>
            <p className="text-sm text-gray-400">{course.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 bg-gray-800/50 p-3 space-y-1 overflow-y-auto shrink-0">
            <p className="text-xs text-gray-500 px-2 mb-2">Files</p>
            {course.files.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                  selected?.id === f.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f.file_type === 'video' ? <Video size={14} /> :
                 f.file_type === 'pdf' ? <FileText size={14} /> : <File size={14} />}
                <span className="truncate">{f.title}</span>
              </button>
            ))}
            {course.files.length === 0 && (
              <p className="text-xs text-gray-600 px-2">No files yet</p>
            )}
          </div>

          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {selected ? (
              <>
                {selected.file_type === 'video' ? (
                  <video
                    controls
                    src={fileUrl}
                    className="flex-1 w-full rounded-lg bg-black"
                  />
                ) : selected.file_type === 'pdf' ? (
                  <iframe
                    src={fileUrl}
                    className="flex-1 w-full rounded-lg border border-gray-700"
                    title={selected.title}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <File size={48} />
                    <p>{selected.title}</p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:underline"
                    >
                      <ExternalLink size={16} /> Open file
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a file to view
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex items-center gap-4">
          <span className="text-sm text-gray-400 shrink-0">Progress:</span>
          <input
            type="range" min={0} max={100} value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-sm font-mono text-white w-10">{Math.round(pct)}%</span>
          <button
            onClick={updateProgress}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
