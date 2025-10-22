"use server"

import { supabase } from "@/lib/supabase"
import { createRecipeSchema, recipeSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCachedData, CACHE_KEYS, cache } from "@/lib/cache"

export async function getRecipes() {
  try {
    console.log("🔍 Intentando obtener recetas...")

    // Verificar si Supabase está configurado correctamente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log("⚠️ Supabase no está configurado correctamente")
      return {
        success: false,
        message: "Supabase no está configurado. Crea un archivo .env.local con las credenciales correctas.",
        needsSetup: true
      }
    }

    const data = await getCachedData(
      CACHE_KEYS.RECIPES,
      async () => {
        console.log("📡 Consultando Supabase...")

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
                cost_per_unit
              )
            )
          `)
          .eq("active", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("❌ Error de Supabase:", error)
          throw new Error(`Supabase error: ${error.message} (${error.code || 'sin código'})`)
        }

        console.log("✅ Datos obtenidos:", data?.length || 0, "recetas")
        return data || []
      },
      2 * 60 * 1000 // 2 minutos de caché
    )

    console.log("🎯 Retornando datos exitosamente")
    return { success: true, data }
  } catch (error: any) {
    console.error("💥 Error completo en getRecipes:", error)
    console.error("Tipo de error:", typeof error)
    console.error("Propiedades del error:", Object.keys(error))
    console.error("Mensaje del error:", error.message)

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
    console.error("Error fetching recipe:", error)
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
    return { success: true, data: recipe, message: "Receta creada exitosamente" }
  } catch (error: any) {
    console.error("Error creating recipe:", error)
    return { success: false, message: error.message || "Error al crear receta" }
  }
}

export async function updateRecipe(id: string, formData: z.infer<typeof createRecipeSchema>) {
  try {
    const validated = createRecipeSchema.parse(formData)

    // Update recipe
    const { error: recipeError } = await supabase
      .from("recipes")
      .update({
        name: validated.name,
        description: validated.description,
        servings: validated.servings,
        image_url: validated.image_url,
      })
      .eq("id", id)

    if (recipeError) throw recipeError

    // Delete existing ingredients
    await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", id)

    // Insert new ingredients
    const ingredientsToInsert = validated.ingredients.map(ing => ({
      recipe_id: id,
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
    revalidatePath(`/recetas/${id}`)
    return { success: true, message: "Receta actualizada exitosamente" }
  } catch (error: any) {
    console.error("Error updating recipe:", error)
    return { success: false, message: error.message || "Error al actualizar receta" }
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
    console.error("Error deleting recipe:", error)
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
    console.error("Error duplicating recipe:", error)
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
    console.error("Error calculating recipe cost:", error)
    return { success: false, message: error.message || "Error al calcular costo" }
  }
}



