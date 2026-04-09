import React from 'react'
import { format, isAfter, parseISO, formatDistanceToNow } from 'date-fns'
import { Task, TaskStatus } from '../types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
}

const priorityConfig = {
  low:    { label: 'Low',    badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-400' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700',     border: 'border-l-amber-400'   },
  high:   { label: 'High',   badge: 'bg-red-100 text-red-700',         border: 'border-l-red-400'     },
}

const statusConfig = {
  pending:     { label: 'Pending',     badge: 'bg-slate-100 text-slate-600'   },
  in_progress: { label: 'In Progress', badge: 'bg-blue-100 text-blue-700'     },
  completed:   { label: 'Completed',   badge: 'bg-emerald-100 text-emerald-700' },
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const isCompleted = task.status === 'completed'

  const deadline = task.deadline ? parseISO(task.deadline) : null
  const isOverdue = deadline && isAfter(new Date(), deadline) && !isCompleted

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${priority.border} hover:shadow-md transition-shadow ${isCompleted ? 'opacity-70' : ''}`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2.5 mb-2">
          {/* Status toggle */}
          <button
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
            title="Cycle status"
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-primary-500'
            }`}
          >
            {isCompleted && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Title */}
          <h3
            className={`flex-1 font-semibold text-slate-800 leading-snug text-sm ${
              isCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0 -mt-0.5">
            <button
              onClick={() => onEdit(task)}
              title="Edit"
              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              title="Delete"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 mb-3 ml-7 line-clamp-2">{task.description}</p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap ml-7">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.badge}`}>
            {status.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.badge}`}>
            {priority.label}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              !deadline
                ? 'bg-slate-100 text-slate-500'
                : isOverdue
                ? 'bg-red-100 text-red-700'
                : isCompleted
                ? 'bg-slate-100 text-slate-500'
                : 'bg-violet-100 text-violet-700'
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {!deadline ? 'No deadline' : `${isOverdue ? 'Overdue · ' : ''}${format(deadline, 'MMM d, yyyy')}`}
          </span>
        </div>

        {/* Relative time */}
        <p className="text-xs text-slate-400 mt-2 ml-7">
          Updated {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export default TaskCard
