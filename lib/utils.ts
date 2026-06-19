import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRefNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `W3D-${year}-${rand}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-SA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateAr(date: Date | string): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  reviewing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  in_production: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ready: 'bg-green-500/15 text-green-400 border-green-500/30',
  delivered: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  in_production: 'In Production',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
