import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

const MOCK_USERS_KEY = 'sjt_mock_users'
const MOCK_TASKS_KEY = 'sjt_mock_tasks'
const MOCK_FALLBACK_NOTICE_KEY = 'sjt_mock_fallback_notice'

type MockUser = {
  id: string
  username: string
  email: string
  password: string
  created_at: string
}

type MockTask = {
  id: string
  user_id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  deadline: string | null
  created_at: string
  updated_at: string
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const writeJson = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const getUsers = () => readJson<MockUser[]>(MOCK_USERS_KEY, [])
const saveUsers = (users: MockUser[]) => writeJson(MOCK_USERS_KEY, users)
const getTasks = () => readJson<MockTask[]>(MOCK_TASKS_KEY, [])
const saveTasks = (tasks: MockTask[]) => writeJson(MOCK_TASKS_KEY, tasks)

const nowIso = () => new Date().toISOString()
const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`

const toToken = (userId: string) => `mock.${userId}.${Date.now().toString(36)}`
const userIdFromToken = (token: string | null) => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 3 || parts[0] !== 'mock') return null
  return parts[1] || null
}

const getHeaderValue = (headers: AxiosRequestConfig['headers'], headerName: string) => {
  if (!headers) return undefined

  if (headers instanceof AxiosHeaders) {
    return headers.get(headerName) ?? undefined
  }

  const maybeRecord = headers as Record<string, unknown>
  const direct = maybeRecord[headerName]
  if (typeof direct === 'string') return direct

  const lower = maybeRecord[headerName.toLowerCase()]
  if (typeof lower === 'string') return lower

  return undefined
}

const toInternalConfig = (config: AxiosRequestConfig): InternalAxiosRequestConfig => {
  const hasAxiosHeaderShape =
    !!config.headers && typeof (config.headers as { set?: unknown }).set === 'function'
  const headers = hasAxiosHeaderShape
    ? (config.headers as AxiosHeaders)
    : new AxiosHeaders((config.headers || {}) as any)
  return { ...(config as InternalAxiosRequestConfig), headers }
}

const makeResponse = <T>(config: AxiosRequestConfig, status: number, data: T): AxiosResponse<T> => ({
  data,
  status,
  statusText: status === 200 || status === 201 ? 'OK' : 'Error',
  headers: {},
  config: toInternalConfig(config),
})

const rejectWithApiError = (config: AxiosRequestConfig, status: number, message: string) =>
  Promise.reject({
    config: toInternalConfig(config),
    response: {
      status,
      data: { error: message },
      config: toInternalConfig(config),
      headers: {},
      statusText: 'Error',
    },
    isAxiosError: true,
  })

const normalizePath = (config: AxiosRequestConfig) => {
  const url = config.url || ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      return parsed.pathname
    } catch {
      return url
    }
  }
  return url.startsWith('/') ? url : `/${url}`
}

const parseBody = (config: AxiosRequestConfig) => {
  if (!config.data) return {}
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return config.data as Record<string, unknown>
}

const getCurrentMockUser = (config: AxiosRequestConfig) => {
  const authHeader = getHeaderValue(config.headers, 'Authorization')
  const tokenFromHeader =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
  const token = tokenFromHeader || localStorage.getItem('token')
  const userId = userIdFromToken(token)
  if (!userId) return null
  const users = getUsers()
  return users.find((u) => u.id === userId) || null
}

const logMockFallbackOnce = () => {
  if (sessionStorage.getItem(MOCK_FALLBACK_NOTICE_KEY)) return
  sessionStorage.setItem(MOCK_FALLBACK_NOTICE_KEY, '1')
  console.warn('API unavailable: switched to local offline mode (localStorage).')
}

const handleMockRequest = async (config: AxiosRequestConfig) => {
  const path = normalizePath(config)
  const method = (config.method || 'get').toLowerCase()
  const body = parseBody(config)

  if (path === '/auth/register' && method === 'post') {
    const username = String(body.username || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!username || !email || !password) {
      return rejectWithApiError(config, 400, 'All fields are required')
    }
    if (password.length < 6) {
      return rejectWithApiError(config, 400, 'Password must be at least 6 characters')
    }

    const users = getUsers()
    if (users.some((u) => u.email === email)) {
      return rejectWithApiError(config, 409, 'Email already in use')
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return rejectWithApiError(config, 409, 'Username already taken')
    }

    const newUser: MockUser = {
      id: randomId(),
      username,
      email,
      password,
      created_at: nowIso(),
    }

    users.push(newUser)
    saveUsers(users)

    const token = toToken(newUser.id)
    return makeResponse(config, 201, {
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    })
  }

  if (path === '/auth/login' && method === 'post') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return rejectWithApiError(config, 400, 'Email and password are required')
    }

    const user = getUsers().find((u) => u.email === email)
    if (!user || user.password !== password) {
      return rejectWithApiError(config, 401, 'Invalid credentials')
    }

    const token = toToken(user.id)
    return makeResponse(config, 200, {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    })
  }

  if (path === '/auth/me' && method === 'get') {
    const user = getCurrentMockUser(config)
    if (!user) {
      return rejectWithApiError(config, 401, 'Access token required')
    }

    return makeResponse(config, 200, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    })
  }

  if (path === '/tasks' && method === 'get') {
    const user = getCurrentMockUser(config)
    if (!user) {
      return rejectWithApiError(config, 401, 'Access token required')
    }

    const tasks = getTasks().filter((t) => t.user_id === user.id)
    tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return makeResponse(config, 200, { tasks })
  }

  if (path === '/tasks' && method === 'post') {
    const user = getCurrentMockUser(config)
    if (!user) {
      return rejectWithApiError(config, 401, 'Access token required')
    }

    const title = String(body.title || '').trim()
    if (!title) {
      return rejectWithApiError(config, 400, 'Title is required')
    }

    const deadlineRaw = body.deadline
    let deadline: string | null = null
    if (deadlineRaw !== null && deadlineRaw !== undefined && String(deadlineRaw) !== '') {
      const parsed = new Date(String(deadlineRaw))
      if (Number.isNaN(parsed.getTime())) {
        return rejectWithApiError(config, 400, 'Invalid deadline format')
      }
      deadline = parsed.toISOString()
    }

    const now = nowIso()
    const task: MockTask = {
      id: randomId(),
      user_id: user.id,
      title,
      description: String(body.description || '').trim(),
      status: (body.status as MockTask['status']) || 'pending',
      priority: (body.priority as MockTask['priority']) || 'medium',
      deadline,
      created_at: now,
      updated_at: now,
    }

    const tasks = getTasks()
    tasks.push(task)
    saveTasks(tasks)

    return makeResponse(config, 201, { task })
  }

  if (path.startsWith('/tasks/') && method === 'put') {
    const user = getCurrentMockUser(config)
    if (!user) {
      return rejectWithApiError(config, 401, 'Access token required')
    }

    const taskId = path.split('/').pop()
    if (!taskId) {
      return rejectWithApiError(config, 400, 'Invalid task ID')
    }

    const tasks = getTasks()
    const index = tasks.findIndex((t) => t.id === taskId && t.user_id === user.id)
    if (index === -1) {
      return rejectWithApiError(config, 404, 'Task not found')
    }

    const current = tasks[index]
    const next = { ...current }

    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (!title) {
        return rejectWithApiError(config, 400, 'Title cannot be empty')
      }
      next.title = title
    }

    if (body.description !== undefined) {
      next.description = String(body.description || '').trim()
    }

    if (body.status !== undefined) {
      const status = String(body.status)
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        return rejectWithApiError(config, 400, 'Invalid status')
      }
      next.status = status as MockTask['status']
    }

    if (body.priority !== undefined) {
      const priority = String(body.priority)
      if (!['low', 'medium', 'high'].includes(priority)) {
        return rejectWithApiError(config, 400, 'Invalid priority')
      }
      next.priority = priority as MockTask['priority']
    }

    if (body.deadline !== undefined) {
      if (body.deadline === null || String(body.deadline) === '') {
        next.deadline = null
      } else {
        const parsed = new Date(String(body.deadline))
        if (Number.isNaN(parsed.getTime())) {
          return rejectWithApiError(config, 400, 'Invalid deadline format')
        }
        next.deadline = parsed.toISOString()
      }
    }

    next.updated_at = nowIso()
    tasks[index] = next
    saveTasks(tasks)

    return makeResponse(config, 200, { task: next })
  }

  if (path.startsWith('/tasks/') && method === 'delete') {
    const user = getCurrentMockUser(config)
    if (!user) {
      return rejectWithApiError(config, 401, 'Access token required')
    }

    const taskId = path.split('/').pop()
    if (!taskId) {
      return rejectWithApiError(config, 400, 'Invalid task ID')
    }

    const tasks = getTasks()
    const filtered = tasks.filter((t) => !(t.id === taskId && t.user_id === user.id))

    if (filtered.length === tasks.length) {
      return rejectWithApiError(config, 404, 'Task not found')
    }

    saveTasks(filtered)
    return makeResponse(config, 200, { message: 'Task deleted' })
  }

  return rejectWithApiError(config, 404, 'Route not found')
}

const shouldUseMockFallback = (error: unknown) => {
  const e = error as { response?: { status?: number } }
  if (!e.response) return true
  const status = e.response.status || 0
  return status >= 500
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (shouldUseMockFallback(error)) {
      logMockFallbackOnce()
      return handleMockRequest(error.config)
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default apiClient
