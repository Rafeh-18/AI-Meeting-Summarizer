export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}m`
}

export function formatMeetingDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (isToday) return `Today, ${time}`
  if (isYesterday) return `Yesterday, ${time}`

  const weekday = date.toLocaleDateString([], { weekday: 'short' })
  const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${weekday}, ${monthDay} · ${time}`
}