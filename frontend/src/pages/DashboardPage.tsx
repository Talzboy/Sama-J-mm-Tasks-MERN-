import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Task, TaskFormData, TaskStatus } from '../types'
import apiClient from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import StatsBar from '../components/StatsBar'
import TaskCard from '../components/TaskCard'
import TaskFormModal from '../components/TaskFormModal'

type FilterTab = 'all' | TaskStatus
type SortOption =
  | 'newest'
  | 'oldest'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'priority_high'
  | 'priority_low'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const response = await apiClient.get('/tasks')
      setTasks(response.data.tasks)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreateTask = async (data: TaskFormData) => {
    const response = await apiClient.post('/tasks', {
      ...data,
      deadline: data.deadline || null,
    })
    setTasks((prev) => [response.data.task, ...prev])
    toast.success('Task created!')
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return
    const response = await apiClient.put(`/tasks/${editingTask.id}`, {
      ...data,
      deadline: data.deadline || null,
    })
    setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? response.data.task : t)))
    toast.success('Task updated!')
  }

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await apiClient.delete(`/tasks/${id}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, { status })
      setTasks((prev) => prev.map((t) => (t.id === id ? response.data.task : t)))
    } catch {
      toast.error('Failed to update status')
    }
  }

  const openCreate = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = activeFilter === 'all' || t.status === activeFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }

    if (sortBy === 'deadline_asc' || sortBy === 'deadline_desc') {
      const ad = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY
      const bd = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY
      return sortBy === 'deadline_asc' ? ad - bd : bd - ad
    }

    const priorityWeight = { low: 1, medium: 2, high: 3 }
    const pa = priorityWeight[a.priority]
    const pb = priorityWeight[b.priority]
    return sortBy === 'priority_high' ? pb - pa : pa - pb
  })

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  const tabCount = (key: FilterTab) =>
    key === 'all' ? tasks.length : tasks.filter((t) => t.status === key).length

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {getGreeting()}, {user?.username}! 👋
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">Here&apos;s your task overview for today</p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsBar tasks={tasks} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-x-auto flex-shrink-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
                    activeFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm sm:ml-auto">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Sort */}
          <div className="w-full sm:w-52">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-slate-700"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="deadline_asc">Sort: Deadline soonest</option>
              <option value="deadline_desc">Sort: Deadline latest</option>
              <option value="priority_high">Sort: Priority high to low</option>
              <option value="priority_low">Sort: Priority low to high</option>
            </select>
          </div>
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading tasks...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-slate-700 font-semibold mb-1">
              {searchQuery
                ? 'No matching tasks'
                : activeFilter !== 'all'
                ? `No ${activeFilter.replace('_', ' ')} tasks`
                : 'No tasks yet'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
              >
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={openCreate}
        title="Add new task"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 hover:shadow-xl transition flex items-center justify-center z-30"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />
    </div>
  )
}

export default DashboardPage
