"use server"

import { supabase } from "@/lib/supabase"
import { ingredientSchema, ingredientPurchaseSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import type { IngredientsQueryParams, PaginatedResponse, IngredientWithInventory, IngredientPurchase } from "@/lib/types"
import { areUnitsCompatibleServer, convertUnitsServer } from "@/lib/unit-conversions"

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

export async function bulkUpdateIngredientPrices(percentageIncrease: number) {
  try {
    if (percentageIncrease <= 0 || percentageIncrease > 100) {
      return { success: false, message: "El porcentaje debe estar entre 0 y 100" }
    }

    logger.info(`Applying ${percentageIncrease}% price increase to all ingredients`, {}, 'ingredientActions.bulkUpdateIngredientPrices')

    // Obtener todos los ingredientes
    const { data: ingredients, error: fetchError } = await supabase
      .from("ingredients")
      .select("id, cost_per_unit")

    if (fetchError) throw fetchError

    if (!ingredients || ingredients.length === 0) {
      return { success: false, message: "No hay ingredientes para actualizar" }
    }

    // Calcular el multiplicador (ej: 15% = 1.15)
    const multiplier = 1 + (percentageIncrease / 100)

    // Actualizar cada ingrediente con el nuevo precio
    const updatePromises = ingredients.map(ingredient => {
      const newCost = ingredient.cost_per_unit * multiplier
      
      return supabase
        .from("ingredients")
        .update({ cost_per_unit: newCost })
        .eq("id", ingredient.id)
    })

    await Promise.all(updatePromises)

    // Limpiar todos los cachés relacionados
    cache.delete(CACHE_KEYS.INGREDIENTS)
    cache.delete(CACHE_KEYS.PRODUCTS)
    cache.delete(CACHE_KEYS.RECIPES)

    // Revalidate all related paths
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/recetas")

    logger.info(`Successfully updated ${ingredients.length} ingredients with ${percentageIncrease}% increase`, {}, 'ingredientActions.bulkUpdateIngredientPrices')

    return { 
      success: true, 
      message: `Precios actualizados correctamente`,
      updatedCount: ingredients.length
    }
  } catch (error: any) {
    logger.error("Error in bulk price update", error, 'ingredientActions.bulkUpdateIngredientPrices')
    return { success: false, message: error.message || "Error al actualizar precios masivamente" }
  }
}

export async function registerPurchase(formData: z.infer<typeof ingredientPurchaseSchema>) {
  try {
    const validated = ingredientPurchaseSchema.parse(formData)
    
    logger.info(`Registering purchase for ingredient ${validated.ingredient_id}`, validated, 'ingredientActions.registerPurchase')
    
    // Get ingredient details
    const { data: ingredient, error: ingredientError } = await supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit")
      .eq("id", validated.ingredient_id)
      .single()
    
    if (ingredientError || !ingredient) {
      return { success: false, message: "Ingrediente no encontrado" }
    }
    
    // Validate unit compatibility
    if (!areUnitsCompatibleServer(validated.unit_purchased, ingredient.unit)) {
      return { 
        success: false, 
        message: `Las unidades ${validated.unit_purchased} y ${ingredient.unit} no son compatibles para conversión` 
      }
    }
    
    // Convert quantity to ingredient's base unit
    const convertedQuantity = convertUnitsServer(
      validated.quantity_purchased, 
      validated.unit_purchased, 
      ingredient.unit
    )
    
    // Calculate unit cost in the ingredient's base unit
    const calculatedUnitCost = validated.total_price / convertedQuantity
    
    // Insert purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("ingredient_purchases")
      .insert([{
        ingredient_id: validated.ingredient_id,
        purchase_date: validated.purchase_date,
        quantity_purchased: validated.quantity_purchased,
        unit_purchased: validated.unit_purchased,
        total_price: validated.total_price,
        calculated_unit_cost: calculatedUnitCost,
        supplier: validated.supplier,
        notes: validated.notes,
      }])
      .select()
      .single()
    
    if (purchaseError) throw purchaseError
    
    // Update ingredient cost per unit
    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ cost_per_unit: calculatedUnitCost })
      .eq("id", validated.ingredient_id)
    
    if (updateError) throw updateError
    
    // Add inventory movement (IN)
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert([{
        ingredient_id: validated.ingredient_id,
        quantity: convertedQuantity,
        type: "IN",
        notes: `Compra registrada: ${convertedQuantity.toFixed(3)} ${ingredient.unit}`,
      }])
    
    if (movementError) logger.error("Error creating inventory movement", movementError)
    
    // Update inventory quantity
    const { data: existingInventory } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("ingredient_id", validated.ingredient_id)
      .single()
    
    if (existingInventory) {
      await supabase
        .from("inventory")
        .update({ 
          quantity: existingInventory.quantity + convertedQuantity,
          last_updated: new Date().toISOString()
        })
        .eq("ingredient_id", validated.ingredient_id)
    } else {
      await supabase
        .from("inventory")
        .insert([{
          ingredient_id: validated.ingredient_id,
          quantity: convertedQuantity,
          unit: ingredient.unit,
        }])
    }
    
    // Clear caches
    cache.delete(CACHE_KEYS.INGREDIENTS)
    cache.delete(CACHE_KEYS.PRODUCTS)
    cache.delete(CACHE_KEYS.RECIPES)
    
    // Revalidate paths
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/recetas")
    
    logger.info(`Purchase registered successfully for ${ingredient.name}`, { calculatedUnitCost }, 'ingredientActions.registerPurchase')

    return {
      success: true,
      data: purchase,
      message: `Compra registrada. Nuevo costo: $${calculatedUnitCost.toFixed(2)}/${ingredient.unit}`
    }
  } catch (error: any) {
    logger.error("Error registering purchase", error, 'ingredientActions.registerPurchase')
    return { success: false, message: error.message || "Error al registrar compra" }
  }
}

export async function getPurchaseHistory(ingredientId: string) {
  try {
    const { data, error } = await supabase
      .from("ingredient_purchases")
      .select("*, ingredient:ingredients(id, name, unit)")
      .eq("ingredient_id", ingredientId)
      .order("purchase_date", { ascending: false })
    
    if (error) throw error
    
    return { success: true, data: data as IngredientPurchase[] }
  } catch (error: any) {
    logger.error("Error fetching purchase history", error, 'ingredientActions.getPurchaseHistory')
    return { success: false, message: error.message || "Error al obtener historial de compras" }
  }
}



