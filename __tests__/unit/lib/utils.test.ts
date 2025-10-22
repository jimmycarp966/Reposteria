/**
 * Tests unitarios para utilidades generales
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateTime, get_current_date } from '@/lib/utils'

describe('formatCurrency', () => {
  it('debe formatear números como moneda argentina', () => {
    expect(formatCurrency(1000)).toBe('$\xa01.000,00')
    expect(formatCurrency(1500.50)).toBe('$\xa01.500,50')
  })

  it('debe manejar números negativos', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })

  it('debe manejar cero', () => {
    expect(formatCurrency(0)).toBe('$\xa00,00')
  })
})

describe('formatDate', () => {
  it('debe formatear fechas correctamente', () => {
    const date = new Date('2024-12-25')
    const formatted = formatDate(date)
    expect(formatted).toContain('diciembre')
    expect(formatted).toContain('2024')
  })

  it('debe aceptar strings de fecha', () => {
    const formatted = formatDate('2024-01-15')
    expect(formatted).toContain('enero')
  })
})

describe('formatDateTime', () => {
  it('debe incluir hora en el formato', () => {
    const date = new Date('2024-12-25T15:30:00')
    const formatted = formatDateTime(date)
    expect(formatted).toContain('15:30')
  })
})

describe('get_current_date', () => {
  it('debe retornar una fecha válida', () => {
    const date = get_current_date()
    expect(date).toBeInstanceOf(Date)
    expect(date.getTime()).toBeLessThanOrEqual(Date.now())
  })
})

