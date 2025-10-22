/**
 * Tests para esquemas de validación con Zod
 */

import { describe, it, expect } from 'vitest'
import {
  ingredientSchema,
  recipeSchema,
  recipeIngredientSchema,
  createRecipeSchema,
  productSchema,
  orderItemSchema,
  orderSchema,
  inventoryUpdateSchema,
} from '@/lib/validations'

describe('Validaciones de Ingredientes', () => {
  describe('ingredientSchema', () => {
    it('debe validar un ingrediente válido', () => {
      const valid = {
        name: 'Harina',
        unit: 'kg',
        cost_per_unit: 120,
        supplier: 'Proveedor A'
      }
      
      expect(() => ingredientSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar nombre vacío', () => {
      const invalid = {
        name: '',
        unit: 'kg',
        cost_per_unit: 120
      }
      
      expect(() => ingredientSchema.parse(invalid)).toThrow()
    })

    it('debe rechazar costo negativo', () => {
      const invalid = {
        name: 'Harina',
        unit: 'kg',
        cost_per_unit: -10
      }
      
      expect(() => ingredientSchema.parse(invalid)).toThrow()
    })
  })
})

describe('Validaciones de Recetas', () => {
  describe('recipeSchema', () => {
    it('debe validar una receta válida', () => {
      const valid = {
        name: 'Torta de Chocolate',
        description: 'Deliciosa torta',
        servings: 8
      }
      
      expect(() => recipeSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar porciones menor o igual a 0', () => {
      const invalid = {
        name: 'Torta',
        servings: 0
      }
      
      expect(() => recipeSchema.parse(invalid)).toThrow()
    })
  })

  describe('recipeIngredientSchema', () => {
    it('debe validar ingrediente de receta válido', () => {
      const valid = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 2.5,
        unit: 'kg'
      }
      
      expect(() => recipeIngredientSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar cantidad 0 o negativa', () => {
      const invalid = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 0,
        unit: 'kg'
      }
      
      expect(() => recipeIngredientSchema.parse(invalid)).toThrow()
    })
  })

  describe('createRecipeSchema', () => {
    it('debe validar receta con ingredientes', () => {
      const valid = {
        name: 'Torta',
        servings: 8,
        ingredients: [
          {
            ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            quantity: 2,
            unit: 'kg'
          }
        ]
      }
      
      expect(() => createRecipeSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar receta sin ingredientes', () => {
      const invalid = {
        name: 'Torta',
        servings: 8,
        ingredients: []
      }
      
      expect(() => createRecipeSchema.parse(invalid)).toThrow()
    })
  })
})

describe('Validaciones de Productos', () => {
  describe('productSchema', () => {
    it('debe validar un producto válido', () => {
      const valid = {
        name: 'Torta de Chocolate',
        base_cost_cache: 150,
        suggested_price_cache: 240
      }
      
      expect(() => productSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar costos negativos', () => {
      const invalid = {
        name: 'Torta',
        base_cost_cache: -10,
        suggested_price_cache: 100
      }
      
      expect(() => productSchema.parse(invalid)).toThrow()
    })
  })
})

describe('Validaciones de Pedidos', () => {
  describe('orderItemSchema', () => {
    it('debe validar un item de pedido válido', () => {
      const valid = {
        product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 2,
        unit_price: 240,
        cost_at_sale: 150,
        production_time_estimate_minutes: 120
      }
      
      expect(() => orderItemSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar cantidad 0', () => {
      const invalid = {
        product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 0,
        unit_price: 240,
        cost_at_sale: 150,
        production_time_estimate_minutes: 120
      }
      
      expect(() => orderItemSchema.parse(invalid)).toThrow()
    })
  })

  describe('orderSchema', () => {
    it('debe validar un pedido válido', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const valid = {
        type: 'DAILY' as const,
        delivery_date: tomorrow.toISOString().split('T')[0],
        items: [
          {
            product_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            quantity: 1,
            unit_price: 240,
            cost_at_sale: 150,
            production_time_estimate_minutes: 120
          }
        ]
      }
      
      expect(() => orderSchema.parse(valid)).not.toThrow()
    })

    it('debe rechazar pedido sin items', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const invalid = {
        type: 'DAILY' as const,
        delivery_date: tomorrow.toISOString().split('T')[0],
        items: []
      }
      
      expect(() => orderSchema.parse(invalid)).toThrow()
    })
  })
})

describe('Validaciones de Inventario', () => {
  describe('inventoryUpdateSchema', () => {
    it('debe validar una actualización válida', () => {
      const valid = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 10,
        type: 'IN' as const,
        notes: 'Compra semanal'
      }
      
      expect(() => inventoryUpdateSchema.parse(valid)).not.toThrow()
    })

    it('debe aceptar tipo IN y OUT', () => {
      const validIn = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 10,
        type: 'IN' as const
      }
      
      const validOut = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: 5,
        type: 'OUT' as const
      }
      
      expect(() => inventoryUpdateSchema.parse(validIn)).not.toThrow()
      expect(() => inventoryUpdateSchema.parse(validOut)).not.toThrow()
    })

    it('debe rechazar cantidad negativa', () => {
      const invalid = {
        ingredient_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        quantity: -5,
        type: 'IN' as const
      }
      
      expect(() => inventoryUpdateSchema.parse(invalid)).toThrow()
    })
  })
})

