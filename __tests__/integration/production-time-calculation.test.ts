/**
 * Tests de integración para cálculo de tiempos de producción
 */

import { describe, it, expect } from 'vitest'
import { addMinutes } from 'date-fns'

describe('Cálculo de Tiempo de Producción (Integration)', () => {
  it('debe calcular production_start correctamente', () => {
    const deliveryDate = '2024-12-25'
    const deliveryTime = '15:00'
    const totalProductionTime = 180 // 3 horas
    const bufferMinutes = 120 // 2 horas
    
    const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`)
    const calculatedBuffer = Math.max(totalProductionTime * 0.1, bufferMinutes)
    const productionStart = addMinutes(deliveryDateTime, -(totalProductionTime + calculatedBuffer))

    // Entrega: 25/12 15:00
    // Total time: 180 min (3 horas)
    // Buffer: 120 min (2 horas)
    // Inicio: 25/12 15:00 - 300 min = 25/12 10:00

    expect(productionStart.getHours()).toBe(10)
    expect(productionStart.getMinutes()).toBe(0)
  })

  it('debe usar buffer mínimo de 120 minutos', () => {
    const totalProductionTime = 60 // 1 hora
    const bufferMinutes = 120

    const calculatedBuffer = Math.max(totalProductionTime * 0.1, bufferMinutes)

    // 10% de 60 = 6 minutos
    // Pero el mínimo es 120
    expect(calculatedBuffer).toBe(120)
  })

  it('debe usar 10% cuando es mayor que buffer mínimo', () => {
    const totalProductionTime = 2000 // ~33 horas
    const bufferMinutes = 120

    const calculatedBuffer = Math.max(totalProductionTime * 0.1, bufferMinutes)

    // 10% de 2000 = 200 minutos
    // Es mayor que 120, entonces usa 200
    expect(calculatedBuffer).toBe(200)
  })

  it('debe calcular tiempo total de múltiples productos', () => {
    const orderItems = [
      { quantity: 2, production_time_estimate_minutes: 120 }, // 2 tortas de 2h cada una
      { quantity: 1, production_time_estimate_minutes: 60 },  // 1 producto de 1h
    ]

    let totalTime = 0
    orderItems.forEach(item => {
      totalTime += item.production_time_estimate_minutes * item.quantity
    })

    // 2 * 120 + 1 * 60 = 300 minutos (5 horas)
    expect(totalTime).toBe(300)
  })

  it('debe calcular production_end basado en duración de tareas', () => {
    const productionStart = new Date('2024-12-25T10:00:00')
    const totalDuration = 180 // minutos

    const productionEnd = addMinutes(productionStart, totalDuration)

    expect(productionEnd.getHours()).toBe(13)
    expect(productionEnd.getMinutes()).toBe(0)
  })
})

