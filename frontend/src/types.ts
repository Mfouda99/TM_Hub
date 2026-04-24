export interface Member {
  id: number
  expa_id: string
  full_name: string
  email: string
  function: string
  position?: string
  profile_picture: string
  home_lc: string
  joined_at: string
  login_count: number
  quizzes_taken?: number
  avg_score?: number
  course_completion?: number
}

export interface CourseFile {
  id: number
  file: string
  file_type: 'pdf' | 'doc' | 'video' | 'other'
  title: string
  uploaded_at: string
}

export interface Course {
  id: number
  title: string
  description: string
  function: string
  created_by: number
  created_by_name: string
  created_at: string
  is_active: boolean
  files: CourseFile[]
}

export interface Choice {
  id: number
  text: string
  is_correct?: boolean
}

export interface Question {
  id: number
  text: string
  question_type: 'MCQ' | 'TF'
  order: number
  choices: Choice[]
}

export interface Quiz {
  id: number
  title: string
  course: number | null
  function: string
  created_by: number
  created_at: string
  time_limit_minutes: number | null
  passing_score: number
  is_active: boolean
  questions: Question[]
  question_count: number
}

export interface CourseProgress {
  id: number
  course: number
  course_title: string
  progress_percent: number
  completed: boolean
  last_accessed: string
}

export interface QuizAttempt {
  id: number
  quiz: number
  quiz_title: string
  started_at: string
  completed_at: string | null
  score: number | null
  passed: boolean
  answers: Record<string, number>
}

export interface DashboardQuiz {
  quiz_id: number
  quiz_title: string
  function: string
  score: number
  passed: boolean
  taken_at: string
}

export interface DashboardCourse {
  course_id: number
  course_title: string
  function: string
  enrolled_at: string
}

export interface DashboardData {
  courses_enrolled: number
  quizzes_taken: number
  avg_score: number
  passed_count: number
  recent_quizzes: DashboardQuiz[]
  recent_courses: DashboardCourse[]
}

export interface CustomCourse {
  id: number
  function: string
  course_title: string
  course_description: string
  course_url: string
  created_at: string
}

export interface SubmitResult {
  attempt_id: number
  score: number
  passed: boolean
  correct_count: number
  total: number
  correct_answers: Record<string, number>
  per_question?: Array<{
    id: number | string
    text: string
    choices?: Array<{ id: number | string; text: string; is_correct?: boolean; is_selected?: boolean }>
    selected?: number | string | null
    correct?: number | string | null
  }>
}
