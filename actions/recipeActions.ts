"use server"

import { supabase } from "@/lib/supabase"
import { createRecipeSchema, recipeSchema, editRecipeSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import type { RecipesQueryParams, PaginatedResponse, RecipeWithIngredients } from "@/lib/types"

export async function getRecipes(params: RecipesQueryParams = {}): Promise<PaginatedResponse<RecipeWithIngredients>> {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    activeOnly = true
  } = params

  try {
    logger.debug('Fetching recipes', params, 'recipeActions.getRecipes')

    // Verificar si Supabase está configurado correctamente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      logger.warn("Supabase not configured", null, 'recipeActions.getRecipes')
      return {
        success: false,
        message: "Supabase no está configurado. Crea un archivo .env.local con las credenciales correctas.",
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name,
            cost_per_unit,
            unit
          )
        )
      `, { count: 'exact' })
      .range(from, to)
      .order("created_at", { ascending: false })

    if (activeOnly) {
      query = query.eq("active", true)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error("Supabase error in getRecipes", error, 'recipeActions.getRecipes')
      throw new Error(`Supabase error: ${error.message} (${error.code || 'sin código'})`)
    }

    logger.info(`Fetched ${data?.length || 0} recipes`, { count, search }, 'recipeActions.getRecipes')

    return {
      success: true,
      data: data as RecipeWithIngredients[] || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error: any) {
    logger.error("Error in getRecipes", error, 'recipeActions.getRecipes')

    let errorMessage = "Error desconocido al obtener recetas"

    if (error.message?.includes("Failed to fetch")) {
      errorMessage = "No se puede conectar a Supabase. Verifica tu conexión a internet y configuración."
    } else if (error.message?.includes("JWT")) {
      errorMessage = "Error de autenticación con Supabase. Verifica tus credenciales."
    } else if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      errorMessage = "La tabla 'recipes' no existe. Ejecuta las migraciones de Supabase."
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}

export async function getRecipeById(id: string) {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name,
            unit,
            cost_per_unit
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching recipe", error, 'recipeActions.getRecipeById')
    return { success: false, message: error.message || "Error al obtener receta" }
  }
}

export async function createRecipe(formData: z.infer<typeof createRecipeSchema>) {
  try {
    const validated = createRecipeSchema.parse(formData)

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert([{
        name: validated.name,
        description: validated.description,
        servings: validated.servings,
        image_url: validated.image_url,
        active: true, // Asegurar que la receta esté activa desde el inicio
      }])
      .select()
      .single()

    if (recipeError) throw recipeError

    // Insert recipe ingredients
    const ingredientsToInsert = validated.ingredients.map(ing => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert)

    if (ingredientsError) throw ingredientsError

    cache.delete(CACHE_KEYS.RECIPES) // Limpiar caché de recetas
    revalidatePath("/recetas")
    revalidatePath("/productos") // Revalidar página de productos para que aparezca en el selector
    return { success: true, data: recipe, message: "Receta creada exitosamente" }
  } catch (error: any) {
    logger.error("Error creating recipe", error, 'recipeActions.createRecipe')
    return { success: false, message: error.message || "Error al crear receta" }
  }
}


export async function deleteRecipe(id: string) {
  try {
    // Soft delete
    const { error } = await supabase
      .from("recipes")
      .update({ active: false })
      .eq("id", id)

    if (error) throw error

    cache.delete(CACHE_KEYS.RECIPES) // Limpiar caché de recetas
    revalidatePath("/recetas")
    return { success: true, message: "Receta eliminada exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting recipe", error, 'recipeActions.deleteRecipe')
    return { success: false, message: error.message || "Error al eliminar receta" }
  }
}

export async function duplicateRecipe(id: string) {
  try {
    // Get original recipe
    const { data: original, error: fetchError } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients (
          ingredient_id,
          quantity,
          unit
        )
      `)
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Create new recipe with incremented version
    const { data: newRecipe, error: recipeError } = await supabase
      .from("recipes")
      .insert([{
        name: `${original.name} (Copia)`,
        description: original.description,
        servings: original.servings,
        version: original.version + 1,
        image_url: original.image_url,
      }])
      .select()
      .single()

    if (recipeError) throw recipeError

    // Copy ingredients
    const ingredientsToInsert = original.recipe_ingredients.map((ing: any) => ({
      recipe_id: newRecipe.id,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert)

    if (ingredientsError) throw ingredientsError

    cache.delete(CACHE_KEYS.RECIPES) // Limpiar caché de recetas
    revalidatePath("/recetas")
    return { success: true, data: newRecipe, message: "Receta duplicada exitosamente" }
  } catch (error: any) {
    logger.error("Error duplicating recipe", error, 'recipeActions.duplicateRecipe')
    return { success: false, message: error.message || "Error al duplicar receta" }
  }
}

export async function calculateRecipeCost(id: string) {
  try {
    const { data, error } = await supabase
      .rpc("calculate_recipe_cost", { recipe_id_param: id })

    if (error) throw error

    return { success: true, data, message: "Costo calculado exitosamente" }
  } catch (error: any) {
    logger.error("Error calculating recipe cost", error, 'recipeActions.calculateRecipeCost')
    return { success: false, message: error.message || "Error al calcular costo" }
  }
}

export async function updateRecipe(id: string, data: any) {
  try {
    logger.debug(`Updating recipe with ID: ${id}`, data, 'recipeActions.updateRecipe')
    
    // Validate the data
    const validated = editRecipeSchema.parse(data)
    
    // Start a transaction to update recipe and ingredients
    const { data: updatedRecipe, error: recipeError } = await supabase
      .from('recipes')
      .update({
        name: validated.name,
        description: validated.description,
        servings: validated.servings,
        image_url: validated.image_url,
      })
      .eq('id', id)
      .select()
      .single()

    if (recipeError) throw recipeError

    // Delete existing recipe ingredients
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id)

    if (deleteError) throw deleteError

    // Insert new recipe ingredients
    if (validated.ingredients && validated.ingredients.length > 0) {
      const ingredientsToInsert = validated.ingredients.map(ingredient => ({
        recipe_id: id,
        ingredient_id: ingredient.ingredient_id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      }))

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingredientsError) throw ingredientsError
    }

    // Revalidate multiple paths to ensure data updates
    revalidatePath(CACHE_KEYS.RECIPES)
    revalidatePath("/recetas")
    revalidatePath(`/recetas/${id}`)
    cache.delete(CACHE_KEYS.RECIPES) // Clear cache explicitly
    
    logger.info(`Recipe with ID: ${id} updated successfully`, {}, 'recipeActions.updateRecipe')
    return { success: true, message: "Receta actualizada exitosamente" }
  } catch (error: any) {
    logger.error("Error updating recipe", error, 'recipeActions.updateRecipe')
    return { success: false, message: error.message || "Error al actualizar la receta" }
  }
}

export async function activateAllRecipes() {
  try {
    // Primero obtener todas las recetas que no están activas
    const { data: inactiveRecipes, error: fetchError } = await supabase
      .from("recipes")
      .select("id")
      .or("active.is.null,active.eq.false")

    if (fetchError) throw fetchError

    if (!inactiveRecipes || inactiveRecipes.length === 0) {
      return { 
        success: true, 
        message: "Todas las recetas ya estaban activas",
        count: 0
      }
    }

    // Activar todas las recetas inactivas
    const { data, error } = await supabase
      .from("recipes")
      .update({ active: true })
      .in("id", inactiveRecipes.map(r => r.id))
      .select()

    if (error) throw error

    cache.delete(CACHE_KEYS.RECIPES)
    revalidatePath("/recetas")
    revalidatePath("/productos")

    const count = data?.length || 0
    logger.info(`Activated ${count} recipes`, { count }, 'recipeActions.activateAllRecipes')
    
    return { 
      success: true, 
      message: `${count} receta(s) activada(s) exitosamente`,
      count 
    }
  } catch (error: any) {
    logger.error("Error activating recipes", error, 'recipeActions.activateAllRecipes')
    return { success: false, message: error.message || "Error al activar recetas" }
  }
}



