export interface User {
  id: string
  username: string
  email: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  deadline: string | null
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export interface TaskFormData {
  title: string
  description: string
  priority: TaskPriority
  deadline: string
  status: TaskStatus
}
