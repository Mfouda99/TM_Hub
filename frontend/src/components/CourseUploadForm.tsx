import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../api/axios'

const ALLOWED = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'mov', 'webm'])

interface FileState {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

interface Props { courseId: number }

export default function CourseUploadForm({ courseId }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      return ext && ALLOWED.has(ext)
    })
    setFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, status: 'pending' as const, progress: 0 }))])
  }

  const uploadFile = async (idx: number) => {
    const item = files[idx]
    if (item.status !== 'pending') return
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, status: 'uploading' } : f)))

    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('title', item.file.name)

    try {
      await api.post(`/api/courses/${courseId}/upload/`, formData, {
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0
          setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, progress: pct } : f)))
        },
      })
      setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, status: 'done', progress: 100 } : f)))
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Upload failed'
      setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, status: 'error', error: msg } : f)))
    }
  }

  const uploadAll = () => {
    files.forEach((_, i) => uploadFile(i))
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <Upload size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-gray-300 font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-gray-500 mt-1">PDF, DOC, PPT, MP4, MOV, WEBM · max 500 MB</p>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.webm"
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.file.name}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
              </div>
              {item.status === 'done' && <CheckCircle size={18} className="text-green-400 shrink-0" />}
              {item.status === 'error' && <AlertCircle size={18} className="text-red-400 shrink-0" />}
              {item.status === 'pending' && (
                <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                  <X size={16} className="text-gray-500 hover:text-white" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={uploadAll}
            disabled={files.every((f) => f.status !== 'pending')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 mt-2"
          >
            Upload All
          </button>
        </div>
      )}
    </div>
  )
}
