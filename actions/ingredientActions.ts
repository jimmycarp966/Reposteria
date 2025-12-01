"use server"

import { supabase } from "@/lib/supabase"
import { ingredientSchema, ingredientPurchaseSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import type { IngredientsQueryParams, PaginatedResponse, IngredientWithInventory, IngredientPurchase } from "@/lib/types"
import { areUnitsCompatibleServer, convertUnitsServer } from "@/lib/unit-conversions"
import { checkSupabaseConnection, getFallbackData } from "@/lib/supabase-fallback"

export async function getIngredients(params: IngredientsQueryParams = {}): Promise<PaginatedResponse<IngredientWithInventory>> {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    lowStockOnly = false
  } = params

  try {
    logger.debug('Fetching ingredients', params, 'ingredientActions.getIngredients')

    // Check if Supabase is available, otherwise use fallback data
    const isSupabaseAvailable = await checkSupabaseConnection()

    if (!isSupabaseAvailable) {
      logger.info('Using fallback data for ingredients', {}, 'ingredientActions.getIngredients')
      const mockIngredients = getFallbackData('ingredients') as any[]

      // Apply search filter if provided
      let filteredIngredients = mockIngredients
      if (search) {
        filteredIngredients = mockIngredients.filter(ingredient =>
          ingredient.name?.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedIngredients = filteredIngredients.slice(from, to)

      // Add mock inventory data
      const ingredientsWithInventory = paginatedIngredients.map(ingredient => ({
        ...ingredient,
        inventory: {
          quantity: Math.floor(Math.random() * 50) + 10,
          unit: ingredient.unit,
          location: ['Despensa', 'Refrigerador', 'Congelador'][Math.floor(Math.random() * 3)]
        }
      }))

      return {
        success: true,
        data: ingredientsWithInventory,
        pagination: {
          page,
          pageSize,
          total: filteredIngredients.length,
          totalPages: Math.ceil(filteredIngredients.length / pageSize)
        }
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // La relación inventory usa LEFT JOIN implícito por defecto en Supabase
    // Esto asegura que todos los ingredientes aparezcan incluso sin registro de inventory
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
    logger.info('Creating ingredient', { formData }, 'ingredientActions.createIngredient')
    
    // Asegurar que cost_per_unit tenga un valor por defecto si no viene
    const formDataWithDefaults = {
      ...formData,
      cost_per_unit: formData.cost_per_unit ?? 0,
    }

    logger.debug('Form data with defaults', { formDataWithDefaults }, 'ingredientActions.createIngredient')
    
    const validated = ingredientSchema.parse(formDataWithDefaults)
    
    logger.debug('Validated data', { validated }, 'ingredientActions.createIngredient')

    logger.debug('Attempting to insert ingredient into Supabase', {}, 'ingredientActions.createIngredient')
    const { data, error } = await supabase
      .from("ingredients")
      .insert([validated])
      .select()
      .single()

    if (error) {
      logger.error('Supabase error inserting ingredient', { error, validated }, 'ingredientActions.createIngredient')
      throw error
    }

    logger.info('Ingredient created successfully', { ingredientId: data?.id, ingredientName: data?.name }, 'ingredientActions.createIngredient')

    // Create initial inventory record
    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert([{
        ingredient_id: data.id,
        quantity: 0,
        unit: validated.unit,
      }])

    if (inventoryError) {
      logger.error("Error creating inventory record", inventoryError, 'ingredientActions.createIngredient')
      // No fallar la creación del ingrediente si el inventory falla, pero loguear el error
      // El inventory puede crearse después manualmente si es necesario
    }

    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    revalidatePath("/ingredientes")
    return { success: true, data, message: "Ingrediente creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating ingredient", { 
      error, 
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      formData 
    }, 'ingredientActions.createIngredient')
    
    // Devolver mensaje de error más detallado
    let errorMessage = "Error al crear ingrediente"
    if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      errorMessage = `Error ${error.code}: ${error.message || 'Error desconocido'}`
    }
    
    return { success: false, message: errorMessage }
  }
}

export async function updateIngredient(id: string, formData: z.infer<typeof ingredientSchema>) {
  try {
    // Get current ingredient to check if cost changed
    const { data: currentIngredient } = await supabase
      .from("ingredients")
      .select("cost_per_unit")
      .eq("id", id)
      .single()

    const validated = ingredientSchema.parse(formData)

    const { data, error } = await supabase
      .from("ingredients")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Check if cost changed to determine if we need to invalidate recipe cache
    const costChanged = currentIngredient && 
      currentIngredient.cost_per_unit !== validated.cost_per_unit

    cache.delete(CACHE_KEYS.INGREDIENTS) // Limpiar caché de ingredientes
    cache.delete(CACHE_KEYS.PRODUCTS) // Limpiar caché de productos (afectados por cambios de costo)
    
    // If cost changed, also invalidate recipes cache
    if (costChanged) {
      cache.delete(CACHE_KEYS.RECIPES) // Limpiar caché de recetas (afectadas por cambios de costo)
      revalidatePath("/recetas")
      return { success: true, data, message: "Ingrediente actualizado. Si cambiaste el costo, recalculá los productos y recetas afectados." }
    }
    
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
    console.log('🔍 DEBUG registerPurchase: Iniciando validación de datos')
    const validated = ingredientPurchaseSchema.parse(formData)
    console.log('✅ DEBUG registerPurchase: Datos validados:', validated)

    logger.info(`Registering purchase for ingredient ${validated.ingredient_id}`, validated, 'ingredientActions.registerPurchase')

    console.log('🔍 DEBUG registerPurchase: Buscando ingrediente en BD')
    // Get ingredient details
    const { data: ingredient, error: ingredientError } = await supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit")
      .eq("id", validated.ingredient_id)
      .single()

    console.log('📋 DEBUG registerPurchase: Resultado búsqueda ingrediente:', { ingredient, ingredientError })

    if (ingredientError || !ingredient) {
      console.log('❌ DEBUG registerPurchase: Ingrediente no encontrado')
      return { success: false, message: "Ingrediente no encontrado" }
    }

    console.log('🔍 DEBUG registerPurchase: Verificando compatibilidad de unidades')
    console.log('   - unit_purchased:', validated.unit_purchased)
    console.log('   - ingredient.unit:', ingredient.unit)

    // Validate unit compatibility
    if (!areUnitsCompatibleServer(validated.unit_purchased, ingredient.unit)) {
      console.log('❌ DEBUG registerPurchase: Unidades no compatibles')
      return {
        success: false,
        message: `Las unidades ${validated.unit_purchased} y ${ingredient.unit} no son compatibles para conversión`
      }
    }
    console.log('✅ DEBUG registerPurchase: Unidades compatibles')

    console.log('🔄 DEBUG registerPurchase: Convirtiendo cantidad')
    console.log('   - quantity_purchased:', validated.quantity_purchased)
    console.log('   - unit_purchased:', validated.unit_purchased)
    console.log('   - ingredient.unit:', ingredient.unit)

    // Convert quantity to ingredient's base unit
    const convertedQuantity = convertUnitsServer(
      validated.quantity_purchased,
      validated.unit_purchased,
      ingredient.unit
    )

    console.log('📊 DEBUG registerPurchase: Cantidad convertida:', convertedQuantity)

    // Calculate unit cost in the ingredient's base unit
    const calculatedUnitCost = validated.total_price / convertedQuantity
    console.log('💰 DEBUG registerPurchase: Costo unitario calculado:', calculatedUnitCost)

    console.log('💾 DEBUG registerPurchase: Insertando registro de compra en BD')
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

    console.log('📋 DEBUG registerPurchase: Resultado inserción compra:', { purchase, purchaseError })

    if (purchaseError) {
      console.log('❌ DEBUG registerPurchase: Error al insertar compra:', purchaseError)
      throw purchaseError
    }

    console.log('✅ DEBUG registerPurchase: Compra insertada correctamente')

    console.log('🔄 DEBUG registerPurchase: Actualizando costo del ingrediente')
    // Update ingredient cost per unit
    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ cost_per_unit: calculatedUnitCost })
      .eq("id", validated.ingredient_id)

    console.log('📋 DEBUG registerPurchase: Resultado actualización costo:', { updateError })

    if (updateError) {
      console.log('❌ DEBUG registerPurchase: Error al actualizar costo del ingrediente:', updateError)
      throw updateError
    }

    console.log('✅ DEBUG registerPurchase: Costo del ingrediente actualizado correctamente')

    console.log('📦 DEBUG registerPurchase: Gestionando inventario')
    // Add inventory movement (IN)
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert([{
        ingredient_id: validated.ingredient_id,
        quantity: convertedQuantity,
        type: "IN",
        notes: `Compra registrada: ${convertedQuantity.toFixed(3)} ${ingredient.unit}`,
      }])

    console.log('📋 DEBUG registerPurchase: Resultado movimiento inventario:', { movementError })

    if (movementError) {
      console.log('⚠️ DEBUG registerPurchase: Error en movimiento de inventario (no crítico):', movementError)
      logger.error("Error creating inventory movement", movementError)
    }

    // Update inventory quantity
    console.log('🔍 DEBUG registerPurchase: Verificando inventario existente')
    const { data: existingInventory } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("ingredient_id", validated.ingredient_id)
      .single()

    console.log('📋 DEBUG registerPurchase: Inventario existente:', existingInventory)

    if (existingInventory) {
      console.log('🔄 DEBUG registerPurchase: Actualizando inventario existente')
      const updateResult = await supabase
        .from("inventory")
        .update({
          quantity: existingInventory.quantity + convertedQuantity,
          last_updated: new Date().toISOString()
        })
        .eq("ingredient_id", validated.ingredient_id)
      console.log('📋 DEBUG registerPurchase: Resultado actualización inventario:', updateResult)
    } else {
      console.log('🆕 DEBUG registerPurchase: Creando nuevo registro de inventario')
      const insertResult = await supabase
        .from("inventory")
        .insert([{
          ingredient_id: validated.ingredient_id,
          quantity: convertedQuantity,
          unit: ingredient.unit,
        }])
      console.log('📋 DEBUG registerPurchase: Resultado creación inventario:', insertResult)
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



