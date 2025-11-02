"use server"

import { supabase } from "@/lib/supabase"
import { productSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import type { ProductsQueryParams, PaginatedResponse, ProductWithRecipe } from "@/lib/types"
import { convertUnitsServer, areUnitsCompatibleServer } from "@/lib/unit-conversions"

export async function getProducts(params: ProductsQueryParams = {}): Promise<PaginatedResponse<ProductWithRecipe>> {
  const {
    page = 1,
    pageSize = 20,
    search = ''
  } = params

  try {
    logger.debug('Fetching products', params, 'productActions.getProducts')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("products")
      .select(`
        *,
        recipe:recipes (
          id,
          name,
          servings
        )
      `, { count: 'exact' })
      .range(from, to)
      .order("created_at", { ascending: false })

    // Búsqueda por nombre
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    logger.info(`Fetched ${data?.length || 0} products`, { count, search }, 'productActions.getProducts')

    return {
      success: true,
      data: data as ProductWithRecipe[],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error: any) {
    logger.error("Error fetching products", error, 'productActions.getProducts')
    return { success: false, message: error.message || "Error al obtener productos" }
  }
}

export async function getProductById(id: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        recipe:recipes (
          id,
          name,
          servings,
          recipe_ingredients (
            quantity,
            unit,
            ingredient:ingredients (
              id,
              name,
              cost_per_unit,
              unit
            )
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching product", error, 'productActions.getProductById')
    return { success: false, message: error.message || "Error al obtener producto" }
  }
}

export async function createProduct(formData: z.infer<typeof productSchema>) {
  try {
    const validated = productSchema.parse(formData)

    const { data, error } = await supabase
      .from("products")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, data, message: "Producto creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating product", error, 'productActions.createProduct')
    return { success: false, message: error.message || "Error al crear producto" }
  }
}

export async function createProductFromRecipe(recipeId: string, markupPercent: number = 60, customImageUrl?: string) {
  try {
    // Get recipe details with ingredient units
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients (
          quantity,
          unit,
          ingredient:ingredients (
            cost_per_unit,
            unit
          )
        )
      `)
      .eq("id", recipeId)
      .single()

    if (recipeError) throw recipeError

    // Calculate base cost with unit conversion
    let totalCost = 0
    for (const ri of recipe.recipe_ingredients) {
      let itemCost = 0
      
      // Check if ingredient has unit and if units are compatible for conversion
      if (ri.ingredient.unit && areUnitsCompatibleServer(ri.unit, ri.ingredient.unit)) {
        // Convert quantity to ingredient's unit
        const convertedQuantity = convertUnitsServer(ri.quantity, ri.unit, ri.ingredient.unit)
        itemCost = convertedQuantity * ri.ingredient.cost_per_unit
        
        logger.debug('Converted units for ingredient', {
          ingredient: ri.ingredient.name,
          fromQuantity: ri.quantity,
          fromUnit: ri.unit,
          toUnit: ri.ingredient.unit,
          convertedQuantity,
          itemCost
        }, 'productActions.createProductFromRecipe')
      } else {
        // If units are not compatible or ingredient unit is missing, use direct calculation
        itemCost = ri.quantity * ri.ingredient.cost_per_unit
        
        logger.debug('Direct calculation for ingredient', {
          ingredient: ri.ingredient.name,
          quantity: ri.quantity,
          costPerUnit: ri.ingredient.cost_per_unit,
          itemCost
        }, 'productActions.createProductFromRecipe')
      }
      
      totalCost += itemCost
    }

    const baseCostPerServing = totalCost / recipe.servings
    const suggestedPrice = baseCostPerServing * (1 + markupPercent / 100)

    logger.debug('Cost calculation', {
      totalCost,
      servings: recipe.servings,
      baseCostPerServing,
      markupPercent,
      suggestedPrice
    }, 'productActions.createProductFromRecipe')

    // Create product
    // Usar imagen personalizada si se proporciona, sino usar la de la receta
    const productImageUrl = customImageUrl || recipe.image_url
    
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert([{
        recipe_id: recipeId,
        name: recipe.name,
        base_cost_cache: baseCostPerServing,
        suggested_price_cache: suggestedPrice,
        image_url: productImageUrl,
      }])
      .select()
      .single()

    if (productError) throw productError

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, data: product, message: "Producto creado desde receta exitosamente" }
  } catch (error: any) {
    logger.error("Error creating product from recipe", error, 'productActions.createProductFromRecipe')
    return { success: false, message: error.message || "Error al crear producto desde receta" }
  }
}

export async function updateProduct(id: string, formData: z.infer<typeof productSchema>) {
  try {
    const validated = productSchema.parse(formData)

    const { data, error } = await supabase
      .from("products")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, data, message: "Producto actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating product", error, 'productActions.updateProduct')
    return { success: false, message: error.message || "Error al actualizar producto" }
  }
}

export async function updateProductPrice(id: string, markupPercent: number) {
  try {
    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("base_cost_cache")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const suggestedPrice = product.base_cost_cache * (1 + markupPercent / 100)

    const { error } = await supabase
      .from("products")
      .update({ suggested_price_cache: suggestedPrice })
      .eq("id", id)

    if (error) throw error

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, message: "Precio actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating product price", error, 'productActions.updateProductPrice')
    return { success: false, message: error.message || "Error al actualizar precio" }
  }
}

export async function refreshProductCost(id: string) {
  try {
    // Get product with recipe details
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select(`
        *,
        recipe:recipes (
          id,
          servings,
          recipe_ingredients (
            quantity,
            unit,
            ingredient:ingredients (
              cost_per_unit,
              unit
            )
          )
        )
      `)
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    if (!product.recipe) {
      return { success: false, message: "Este producto no tiene receta asociada" }
    }

    // Calculate new base cost with unit conversion
    let totalCost = 0
    for (const ri of product.recipe.recipe_ingredients) {
      let itemCost = 0
      
      // Check if ingredient has unit and if units are compatible for conversion
      if (ri.ingredient.unit && areUnitsCompatibleServer(ri.unit, ri.ingredient.unit)) {
        // Convert quantity to ingredient's unit
        const convertedQuantity = convertUnitsServer(ri.quantity, ri.unit, ri.ingredient.unit)
        itemCost = convertedQuantity * ri.ingredient.cost_per_unit
      } else {
        // If units are not compatible or ingredient unit is missing, use direct calculation
        itemCost = ri.quantity * ri.ingredient.cost_per_unit
      }
      
      totalCost += itemCost
    }

    const baseCostPerServing = totalCost / product.recipe.servings
    
    // Keep the same markup percentage
    const currentMarkup = ((product.suggested_price_cache / product.base_cost_cache) - 1) * 100
    const newSuggestedPrice = baseCostPerServing * (1 + currentMarkup / 100)

    // Update product
    const { error: updateError } = await supabase
      .from("products")
      .update({
        base_cost_cache: baseCostPerServing,
        suggested_price_cache: newSuggestedPrice,
      })
      .eq("id", id)

    if (updateError) throw updateError

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, message: "Costo recalculado exitosamente" }
  } catch (error: any) {
    logger.error("Error refreshing product cost", error, 'productActions.refreshProductCost')
    return { success: false, message: error.message || "Error al recalcular costo" }
  }
}

export async function refreshAllProductCosts() {
  try {
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, recipe_id")
      .not("recipe_id", "is", null)

    if (fetchError) throw fetchError

    let successCount = 0
    let failCount = 0

    for (const product of products) {
      const result = await refreshProductCost(product.id)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return {
      success: true,
      message: `Recalculados: ${successCount} exitosos, ${failCount} fallidos`
    }
  } catch (error: any) {
    logger.error("Error refreshing all product costs", error, 'productActions.refreshAllProductCosts')
    return { success: false, message: error.message || "Error al recalcular costos" }
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) throw error

    cache.delete(CACHE_KEYS.PRODUCTS)
    revalidatePath("/productos")
    return { success: true, message: "Producto eliminado exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting product", error, 'productActions.deleteProduct')
    return { success: false, message: error.message || "Error al eliminar producto" }
  }
}