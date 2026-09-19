import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf_access_token')
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-TOKEN'] = csrfToken
  }
  return config
})

let isRefreshing = false
let pendingQueue = []

function resolveQueue(error) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error)
    else resolve(api(config))
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint =
      config?.url?.includes('/login') ||
      config?.url?.includes('/register') ||
      config?.url?.includes('/refresh') ||
      config?.url?.includes('/me')

    if (response?.status !== 401 || isAuthEndpoint || config._retried) {
      return Promise.reject(error)
    }

    config._retried = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config })
      })
    }

    isRefreshing = true
    try {
      const csrfRefresh = getCookie('csrf_refresh_token')
      await axios.post(
        `${import.meta.env.VITE_API_URL}/refresh`,
        {},
        {
          withCredentials: true,
          headers: csrfRefresh ? { 'X-CSRF-TOKEN': csrfRefresh } : {},
        }
      )
      resolveQueue(null)
      return api(config)
    } catch (refreshError) {
      resolveQueue(refreshError)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api