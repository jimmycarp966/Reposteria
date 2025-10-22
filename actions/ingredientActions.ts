"use server"

import { supabase } from "@/lib/supabase"
import { ingredientSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import type { IngredientsQueryParams, PaginatedResponse, IngredientWithInventory } from "@/lib/types"

export async function getIngredients(params: IngredientsQueryParams = {}): Promise<PaginatedResponse<IngredientWithInventory>> {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    lowStockOnly = false
  } = params

  try {
    logger.debug('Fetching ingredients', params, 'ingredientActions.getIngredients')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("ingredients")
      .select(`
        *,
        inventory (
          quantity,
          unit,
          location
        )
      `, { count: 'exact' })
      .range(from, to)
      .order("name")

    // Búsqueda por nombre
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    let filteredData = data || []

    // Filtrar stock bajo (hacer en cliente ya que es relación)
    if (lowStockOnly) {
      filteredData = filteredData.filter((ing: any) => 
        ing.inventory && ing.inventory.quantity < 10
      )
    }

    logger.info(`Fetched ${filteredData.length} ingredients`, { count, search }, 'ingredientActions.getIngredients')

    return {
      success: true,
      data: filteredData as IngredientWithInventory[],
      pagination: {
        page,
        pageSize,
        total: lowStockOnly ? filteredData.length : (count || 0),
        totalPages: Math.ceil((lowStockOnly ? filteredData.length : (count || 0)) / pageSize)
      }
    }
  } catch (error: any) {
    logger.error("Error fetching ingredients", error, 'ingredientActions.getIngredients')
    return { success: false, message: error.message || "Error al obtener ingredientes" }
  }
}

export async function getIngredientById(id: string) {
  try {
    const { data, error } = await supabase
      .from("ingredients")
      .select(`
        *,
        inventory (
          quantity,
          unit,
          location
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching ingredient", error, 'ingredientActions.getIngredientById')
    return { success: false, message: error.message || "Error al obtener ingrediente" }
  }
}

export async function createIngredient(formData: z.infer<typeof ingredientSchema>) {
  try {
    const validated = ingredientSchema.parse(formData)

    const { data, error } = await supabase
      .from("ingredients")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    // Create initial inventory record
    await supabase
      .from("inventory")
      .insert([{
        ingredient_id: data.id,
        quantity: 0,
        unit: validated.unit,
      }])

    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    revalidatePath("/ingredientes")
    return { success: true, data, message: "Ingrediente creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating ingredient", error, 'ingredientActions.createIngredient')
    return { success: false, message: error.message || "Error al crear ingrediente" }
  }
}

export async function updateIngredient(id: string, formData: z.infer<typeof ingredientSchema>) {
  try {
    const validated = ingredientSchema.parse(formData)

    const { data, error } = await supabase
      .from("ingredients")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    cache.delete(CACHE_KEYS.PRODUCTS) // Limpiar caché de productos (afectados por cambios de costo)
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    return { success: true, data, message: "Ingrediente actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating ingredient", error, 'ingredientActions.updateIngredient')
    return { success: false, message: error.message || "Error al actualizar ingrediente" }
  }
}

export async function deleteIngredient(id: string) {
  try {
    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", id)

    if (error) throw error

    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    revalidatePath("/ingredientes")
    return { success: true, message: "Ingrediente eliminado exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting ingredient", error, 'ingredientActions.deleteIngredient')
    return { success: false, message: error.message || "Error al eliminar ingrediente" }
  }
}

export async function updateIngredientCost(id: string, newCost: number) {
  try {
    if (newCost < 0) {
      return { success: false, message: "El costo debe ser mayor o igual a 0" }
    }

    const { error } = await supabase
      .from("ingredients")
      .update({ cost_per_unit: newCost })
      .eq("id", id)

    if (error) throw error

    // Limpiar caché de datos afectados
    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    cache.delete(CACHE_KEYS.PRODUCTS) // Limpiar caché de productos (afectados por cambios de costo)
    cache.delete(CACHE_KEYS.RECIPES) // Limpiar caché de recetas (afectadas por cambios de costo)

    // Revalidate products that use this ingredient
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/recetas")

    return { success: true, message: "Costo actualizado. Recalcula los productos afectados." }
  } catch (error: any) {
    logger.error("Error updating ingredient cost", error, 'ingredientActions.updateIngredientCost')
    return { success: false, message: error.message || "Error al actualizar costo" }
  }
}



