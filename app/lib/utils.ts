import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEuro(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num)
}

export function formatDatum(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatDatumKort(date: Date | string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit' }).format(new Date(date))
}
