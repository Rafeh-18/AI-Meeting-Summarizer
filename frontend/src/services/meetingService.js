import api from './api'

export const meetingService = {
  list: () => api.get('/meetings').then((r) => r.data.meetings),
  stats: () => api.get('/meetings/stats').then((r) => r.data.stats),
  create: (payload) => api.post('/meetings', payload).then((r) => r.data.meeting),
  remove: (id) => api.delete(`/meetings/${id}`).then((r) => r.data),
  get: (id) => api.get(`/meetings/${id}`).then((r) => r.data.meeting),
  analytics: () => api.get('/meetings/analytics').then((r) => r.data.analytics),
  upload: (formData) => api.post('/meetings/upload', formData).then((r) => r.data.meeting),
  getChatHistory: (id) => api.get(`/meetings/${id}/chat`).then((r) => r.data.messages),
sendChatMessage: (id, message) => api.post(`/meetings/${id}/chat`, { message }).then((r) => r.data),
  process: (id) => api.post(`/meetings/${id}/process`).then((r) => r.data.meeting),
  downloadPdf: (id, filename) =>
    api.get(`/meetings/${id}/pdf`, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `meeting_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }),
}