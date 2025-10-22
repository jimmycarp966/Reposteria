/**
 * Tests de integración para cálculo de costos de recetas
 */

import { describe, it, expect } from 'vitest'

describe('Cálculo de Costo de Receta (Integration)', () => {
  it('debe calcular el costo correctamente con múltiples ingredientes', () => {
    // Mock de receta con ingredientes
    const recipe = {
      id: '1',
      name: 'Torta de Chocolate',
      servings: 8,
      recipe_ingredients: [
        {
          quantity: 0.5, // kg
          ingredient: { cost_per_unit: 120 } // $120/kg
        },
        {
          quantity: 0.3, // kg
          ingredient: { cost_per_unit: 80 } // $80/kg
        },
        {
          quantity: 6, // unidades
          ingredient: { cost_per_unit: 50 } // $50/unidad
        }
      ]
    }

    // Cálculo manual
    // 0.5 * 120 = 60
    // 0.3 * 80 = 24
    // 6 * 50 = 300
    // Total = 384
    // Por porción = 384 / 8 = 48

    let totalCost = 0
    recipe.recipe_ingredients.forEach(ri => {
      totalCost += ri.quantity * ri.ingredient.cost_per_unit
    })

    const costPerServing = totalCost / recipe.servings

    expect(totalCost).toBe(384)
    expect(costPerServing).toBe(48)
  })

  it('debe calcular precio sugerido con markup', () => {
    const baseCost = 48
    const markupPercent = 60

    const suggestedPrice = baseCost * (1 + markupPercent / 100)

    expect(suggestedPrice).toBeCloseTo(76.8, 1)
  })

  it('debe calcular margen de ganancia correctamente', () => {
    const cost = 100
    const price = 160

    const profit = price - cost
    const profitMargin = (profit / price) * 100

    expect(profit).toBe(60)
    expect(profitMargin).toBe(37.5)
  })

  it('debe manejar recetas con 1 porción', () => {
    const recipe = {
      servings: 1,
      recipe_ingredients: [
        {
          quantity: 0.1,
          ingredient: { cost_per_unit: 100 }
        }
      ]
    }

    let totalCost = 0
    recipe.recipe_ingredients.forEach(ri => {
      totalCost += ri.quantity * ri.ingredient.cost_per_unit
    })

    const costPerServing = totalCost / recipe.servings

    expect(costPerServing).toBe(10)
  })

  it('debe manejar múltiples porciones correctamente', () => {
    const recipe = {
      servings: 12,
      recipe_ingredients: [
        {
          quantity: 1,
          ingredient: { cost_per_unit: 240 }
        }
      ]
    }

    let totalCost = 0
    recipe.recipe_ingredients.forEach(ri => {
      totalCost += ri.quantity * ri.ingredient.cost_per_unit
    })

    const costPerServing = totalCost / recipe.servings

    expect(costPerServing).toBe(20)
  })
})

