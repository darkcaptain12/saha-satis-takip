import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: tr })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  try {
    const dt = parseISO(`${dateStr}T${timeStr}`)
    return format(dt, 'dd MMM yyyy HH:mm', { locale: tr })
  } catch {
    return `${dateStr} ${timeStr}`
  }
}

export function formatTime(timeStr: string): string {
  return timeStr?.slice(0, 5) ?? ''
}

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getCurrentTimeStr(): string {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
}

export function getWeekRange(): { from: string; to: string } {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  }
}

export function getMonthRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function getYearRange(): { from: string; to: string } {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

export function locationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    success: 'Alındı',
    failed: 'Alınamadı',
    skipped: 'Atlandı',
  }
  return map[status] ?? status
}
