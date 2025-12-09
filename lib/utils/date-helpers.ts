import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatDayHeader(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  if (isToday(d)) {
    return 'Today'
  }
  if (isYesterday(d)) {
    return 'Yesterday'
  }
  return format(d, 'MMMM d, yyyy')
}

export function formatDuration(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60
    if (remainingMinutes > 0) {
      return `${diffHours}h ${remainingMinutes}m`
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
}

export function groupByDay<T extends { timestamp?: Date | string; createdAt?: Date | string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const date = item.timestamp || item.createdAt
    if (!date) continue

    const d = typeof date === 'string' ? parseISO(date) : date
    const key = format(d, 'yyyy-MM-dd')

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  }

  return groups
}
