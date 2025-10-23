import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, startOfWeek, format } from "date-fns"
import { es } from 'date-fns/locale'

/**
 * Helper para parsear un string de fecha 'yyyy-MM-dd' como un objeto Date en UTC.
 * Esto evita inconsistencias de zona horaria.
 */
const parseDateStringAsUTC = (dateStr: string): Date => {
  // Las fechas en formato 'yyyy-MM-dd' son interpretadas por new Date() como UTC a medianoche.
  // Agregamos 'T00:00:00Z' para ser explícitos y evitar cualquier comportamiento inesperado del navegador/servidor.
  return new Date(`${dateStr}T00:00:00Z`);
};

/**
 * Helper para formatear un objeto Date como un string 'yyyy-MM-dd' en UTC.
 */
const formatDateAsUTCString = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper para formatear un objeto Date en UTC a un string 'dd/MM/yyyy' para mostrar.
 */
const formatUTCDateToDisplay = (date: Date): string => {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};


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
  const current = parseDateStringAsUTC(currentWeekStart)
  const next = addDays(current, 7)
  return formatDateAsUTCString(next)
}

export function getPreviousWeekStart(currentWeekStart: string): string {
  const current = parseDateStringAsUTC(currentWeekStart)
  const previous = addDays(current, -7)
  return formatDateAsUTCString(previous)
}

export function getWeekDateRange(weekStart: string): { start: string; end: string; startRaw: string; endRaw: string } {
  const start = parseDateStringAsUTC(weekStart)
  const end = addDays(start, 6)
  
  return {
    start: formatUTCDateToDisplay(start),
    end: formatUTCDateToDisplay(end),
    startRaw: formatDateAsUTCString(start),
    endRaw: formatDateAsUTCString(end),
  }
}

/**
 * Obtiene el lunes de la semana para cualquier fecha dada, operando en UTC.
 */
export function getMondayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateStringAsUTC(date) : date;
  const day = d.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diff = day - 1; // Queremos que el día 1 (Lunes) sea nuestro punto de partida.
  
  // Si es Domingo (0), necesitamos retroceder 6 días.
  // Para otros días, restamos su valor menos 1.
  const diffToMonday = day === 0 ? -6 : -diff;
  
  const monday = new Date(d.getTime());
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  
  return formatDateAsUTCString(monday);
}

/**
 * Verifica si una fecha (en UTC) es lunes.
 */
export function isMonday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseDateStringAsUTC(date) : date
  return d.getUTCDay() === 1; // 1 es Lunes en UTC
}

/**
 * Obtiene el próximo lunes disponible (si la fecha no es lunes)
 */
export function getNextMonday(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateStringAsUTC(date) : date
  if (isMonday(d)) {
    return formatDateAsUTCString(d)
  }
  
  // Encontrar el próximo lunes
  const daysUntilMonday = (8 - d.getUTCDay()) % 7
  const nextMonday = addDays(d, daysUntilMonday)
  return formatDateAsUTCString(nextMonday)
}

