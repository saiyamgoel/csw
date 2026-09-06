import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}
