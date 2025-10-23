"use client"

import { convertUnits, areUnitsCompatible } from "@/components/shared/UnitSelector"

interface RecipeIngredient {
  id: string
  quantity: number
  unit: string
  ingredient: {
    id: string
    name: string
    cost_per_unit: number
    unit: string
  }
}

interface RecipeCostCalculatorProps {
  ingredients: RecipeIngredient[]
  servings: number
}

export function RecipeCostCalculator({ ingredients, servings }: RecipeCostCalculatorProps) {
  // Calculate costs with unit conversion
  let totalCost = 0
  const ingredientCosts = ingredients.map((ri) => {
    let itemCost = 0
    
    // Check if units are compatible for conversion
    if (areUnitsCompatible(ri.unit, ri.ingredient.unit)) {
      // Convert quantity to ingredient's unit
      const convertedQuantity = convertUnits(ri.quantity, ri.unit, ri.ingredient.unit)
      itemCost = convertedQuantity * ri.ingredient.cost_per_unit
    } else {
      // If units are not compatible, use direct calculation
      itemCost = ri.quantity * ri.ingredient.cost_per_unit
    }
    
    totalCost += itemCost
    
    return {
      ...ri,
      itemCost
    }
  })

  const costPerServing = totalCost / servings

  return {
    totalCost,
    costPerServing,
    ingredientCosts
  }
}
