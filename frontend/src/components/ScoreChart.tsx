import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { QuizAttempt } from '../types'

interface Props { attempts: QuizAttempt[] }

export default function ScoreChart({ attempts }: Props) {
  const data = [...attempts]
    .filter((a) => a.completed_at && a.score !== null)
    .reverse()
    .map((a) => ({
      date: new Date(a.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: a.score,
      quiz: a.quiz_title,
    }))

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No quiz data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
        <YAxis stroke="#6b7280" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: '#60a5fa' }}
          formatter={(v: number) => [`${v}%`, 'Score']}
        />
        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Pass', fill: '#f59e0b', fontSize: 11 }} />
        <Line
          type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
