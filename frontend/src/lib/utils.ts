import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateStr: string, withTime = false): string {
  const d = new Date(dateStr)
  const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  if (!withTime) return datePart
  const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} ${timePart}`
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}
