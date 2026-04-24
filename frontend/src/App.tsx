import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Quizzes from './pages/Quizzes'
import AdminPanel from './pages/admin/AdminPanel'
import CourseCreator from './pages/admin/CourseCreator'
import QuizBuilderPage from './pages/admin/QuizBuilderPage'
import Members from './pages/admin/Members'
import ManageContent from './pages/admin/ManageContent'
import EditQuiz from './pages/admin/EditQuiz'
import EditCourse from './pages/admin/EditCourse'
import AuthGuard from './components/AuthGuard'
import DashboardLayout from './components/DashboardLayout'
import { useAuthStore } from './store/authStore'
import QuizDetail from './pages/QuizDetail'

function RootRedirect() {
  const token = useAuthStore((s) => s.token)
  const member = useAuthStore((s) => s.member)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const fn = member?.function?.toLowerCase() || 'other'
  return <Navigate to={`/${fn}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="/:fn" element={<Dashboard />} />
            <Route path="/:fn/courses" element={<Courses />} />
            <Route path="/:fn/quizzes" element={<Quizzes />} />
            <Route path="/:fn/quizzes/:id" element={<QuizDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/courses/new" element={<CourseCreator />} />
            <Route path="/admin/quizzes/new" element={<QuizBuilderPage />} />
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/manage" element={<ManageContent />} />
            <Route path="/admin/quizzes/:id/edit" element={<EditQuiz />} />
            <Route path="/admin/courses/:id/edit" element={<EditCourse />} />
          </Route>
        </Route>
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
