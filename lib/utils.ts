import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, startOfWeek, format } from "date-fns"
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene la fecha y hora actual del sistema
 * Esta función debe usarse siempre en lugar de new Date() para asegurar
 * que se está usando la fecha correcta del sistema
 */
export function get_current_date(): Date {
  return new Date()
}

/**
 * Formatea una fecha para mostrar en la UI
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea una fecha y hora para mostrar en la UI
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

// Weekly plan utilities
export function getCurrentWeekStart(): string {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1, locale: es })
  return format(weekStart, 'yyyy-MM-dd')
}

export function getNextWeekStart(currentWeekStart: string): string {
  const current = new Date(currentWeekStart)
  const next = addDays(current, 7)
  return format(next, 'yyyy-MM-dd')
}

export function getPreviousWeekStart(currentWeekStart: string): string {
  const current = new Date(currentWeekStart)
  const previous = addDays(current, -7)
  return format(previous, 'yyyy-MM-dd')
}

export function getWeekDateRange(weekStart: string): { start: string; end: string } {
  const start = new Date(weekStart)
  const end = addDays(start, 6)
  
  return {
    start: format(start, 'dd/MM/yyyy'),
    end: format(end, 'dd/MM/yyyy')
  }
}

