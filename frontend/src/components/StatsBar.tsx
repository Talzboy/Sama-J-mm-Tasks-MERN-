import React from 'react'
import { Task } from '../types'

interface StatsBarProps {
  tasks: Task[]
}

const StatsBar: React.FC<StatsBarProps> = ({ tasks }) => {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const pending = tasks.filter((t) => t.status === 'pending').length
  const now = new Date()
  const overdue = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'completed'
  ).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      iconBg: 'bg-slate-100 text-slate-500',
      valueCls: 'text-slate-800',
    },
    {
      label: 'Completed',
      value: completed,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-emerald-100 text-emerald-600',
      valueCls: 'text-emerald-700',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100 text-blue-600',
      valueCls: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: pending,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-amber-100 text-amber-600',
      valueCls: 'text-amber-700',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-red-100 text-red-600',
      valueCls: overdue > 0 ? 'text-red-700' : 'text-slate-800',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.iconBg}`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold ${s.valueCls}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-primary-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {completed} of {total} tasks completed
          </p>
        </div>
      )}
    </div>
  )
}

export default StatsBar
