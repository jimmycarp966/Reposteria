"use server"

import { createSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface PriceHistoryEntry {
  id: string
  old_price: number | null
  new_price: number
  changed_at: string
  changed_by: string | null
  change_reason: string | null
  price_change: number
  price_change_percentage: number
}

export interface PriceHistoryResult {
  success: boolean
  data?: PriceHistoryEntry[]
  error?: string
}

/**
 * Obtiene el historial de precios de un producto
 */
export async function getProductPriceHistory(productId: string): Promise<PriceHistoryResult> {
  try {
    const supabase = createSupabaseClient()
    
    if (!productId) {
      return {
        success: false,
        error: "ID del producto es requerido"
      }
    }

    const { data, error } = await supabase.rpc('get_product_price_history', {
      product_uuid: productId
    })

    if (error) {
      console.error('Error al obtener historial de precios del producto:', error)
      return {
        success: false,
        error: `Error al obtener historial: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    console.error('Error inesperado al obtener historial de precios del producto:', error)
    return {
      success: false,
      error: "Error interno del servidor"
    }
  }
}

/**
 * Obtiene el historial de precios de un ingrediente
 */
export async function getIngredientPriceHistory(ingredientId: string): Promise<PriceHistoryResult> {
  try {
    const supabase = createSupabaseClient()
    
    if (!ingredientId) {
      return {
        success: false,
        error: "ID del ingrediente es requerido"
      }
    }

    const { data, error } = await supabase.rpc('get_ingredient_price_history', {
      ingredient_uuid: ingredientId
    })

    if (error) {
      console.error('Error al obtener historial de precios del ingrediente:', error)
      return {
        success: false,
        error: `Error al obtener historial: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    console.error('Error inesperado al obtener historial de precios del ingrediente:', error)
    return {
      success: false,
      error: "Error interno del servidor"
    }
  }
}

/**
 * Obtiene estadísticas de cambios de precios para un producto
 */
export async function getProductPriceStats(productId: string): Promise<{
  success: boolean
  data?: {
    total_changes: number
    first_price: number | null
    current_price: number | null
    highest_price: number | null
    lowest_price: number | null
    average_price: number | null
    total_increase: number
    total_decrease: number
  }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    if (!productId) {
      return {
        success: false,
        error: "ID del producto es requerido"
      }
    }

    // Obtener historial completo
    const historyResult = await getProductPriceHistory(productId)
    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: historyResult.error || "Error al obtener historial"
      }
    }

    const history = historyResult.data

    if (history.length === 0) {
      return {
        success: true,
        data: {
          total_changes: 0,
          first_price: null,
          current_price: null,
          highest_price: null,
          lowest_price: null,
          average_price: null,
          total_increase: 0,
          total_decrease: 0
        }
      }
    }

    // Calcular estadísticas
    const prices = history.map(h => h.new_price)
    const firstPrice = history[history.length - 1]?.old_price || history[history.length - 1]?.new_price
    const currentPrice = history[0]?.new_price
    const highestPrice = Math.max(...prices)
    const lowestPrice = Math.min(...prices)
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

    let totalIncrease = 0
    let totalDecrease = 0

    history.forEach(entry => {
      if (entry.price_change > 0) {
        totalIncrease += entry.price_change
      } else if (entry.price_change < 0) {
        totalDecrease += Math.abs(entry.price_change)
      }
    })

    return {
      success: true,
      data: {
        total_changes: history.length,
        first_price: firstPrice,
        current_price: currentPrice,
        highest_price: highestPrice,
        lowest_price: lowestPrice,
        average_price: Math.round(averagePrice * 100) / 100,
        total_increase: Math.round(totalIncrease * 100) / 100,
        total_decrease: Math.round(totalDecrease * 100) / 100
      }
    }
  } catch (error) {
    console.error('Error inesperado al obtener estadísticas de precios:', error)
    return {
      success: false,
      error: "Error interno del servidor"
    }
  }
}

/**
 * Obtiene estadísticas de cambios de precios para un ingrediente
 */
export async function getIngredientPriceStats(ingredientId: string): Promise<{
  success: boolean
  data?: {
    total_changes: number
    first_price: number | null
    current_price: number | null
    highest_price: number | null
    lowest_price: number | null
    average_price: number | null
    total_increase: number
    total_decrease: number
  }
  error?: string
}> {
  try {
    const supabase = createSupabaseClient()
    
    if (!ingredientId) {
      return {
        success: false,
        error: "ID del ingrediente es requerido"
      }
    }

    // Obtener historial completo
    const historyResult = await getIngredientPriceHistory(ingredientId)
    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: historyResult.error || "Error al obtener historial"
      }
    }

    const history = historyResult.data

    if (history.length === 0) {
      return {
        success: true,
        data: {
          total_changes: 0,
          first_price: null,
          current_price: null,
          highest_price: null,
          lowest_price: null,
          average_price: null,
          total_increase: 0,
          total_decrease: 0
        }
      }
    }

    // Calcular estadísticas
    const prices = history.map(h => h.new_price)
    const firstPrice = history[history.length - 1]?.old_price || history[history.length - 1]?.new_price
    const currentPrice = history[0]?.new_price
    const highestPrice = Math.max(...prices)
    const lowestPrice = Math.min(...prices)
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

    let totalIncrease = 0
    let totalDecrease = 0

    history.forEach(entry => {
      if (entry.price_change > 0) {
        totalIncrease += entry.price_change
      } else if (entry.price_change < 0) {
        totalDecrease += Math.abs(entry.price_change)
      }
    })

    return {
      success: true,
      data: {
        total_changes: history.length,
        first_price: firstPrice,
        current_price: currentPrice,
        highest_price: highestPrice,
        lowest_price: lowestPrice,
        average_price: Math.round(averagePrice * 100) / 100,
        total_increase: Math.round(totalIncrease * 100) / 100,
        total_decrease: Math.round(totalDecrease * 100) / 100
      }
    }
  } catch (error) {
    console.error('Error inesperado al obtener estadísticas de precios:', error)
    return {
      success: false,
      error: "Error interno del servidor"
    }
  }
}

/**
 * Registra manualmente un cambio de precio (para casos especiales)
 */
export async function logManualPriceChange(
  type: 'product' | 'ingredient',
  itemId: string,
  oldPrice: number | null,
  newPrice: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient()
    
    if (!itemId || !newPrice) {
      return {
        success: false,
        error: "ID del item y precio nuevo son requeridos"
      }
    }

    const tableName = type === 'product' ? 'product_price_history' : 'ingredient_price_history'
    const idField = type === 'product' ? 'product_id' : 'ingredient_id'

    const { error } = await supabase
      .from(tableName)
      .insert({
        [idField]: itemId,
        old_price: oldPrice,
        new_price: newPrice,
        change_reason: reason || 'Cambio manual de precio'
      })

    if (error) {
      console.error(`Error al registrar cambio manual de precio ${type}:`, error)
      return {
        success: false,
        error: `Error al registrar cambio: ${error.message}`
      }
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/productos')
    revalidatePath('/ingredientes')

    return { success: true }
  } catch (error) {
    console.error('Error inesperado al registrar cambio manual de precio:', error)
    return {
      success: false,
      error: "Error interno del servidor"
    }
  }
}
