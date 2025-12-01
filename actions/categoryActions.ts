"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logger } from "@/lib/logger"

// Zod Schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser un código hexadecimal válido"),
})

// Get all categories
export async function getTaskCategories() {
  try {
    const { data, error } = await supabase
      .from("task_categories")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching task categories", error, 'categoryActions.getTaskCategories')
    return { success: false, message: error.message }
  }
}

// Create a new category
export async function createTaskCategory(formData: { name: string; color: string }) {
  try {
    const validated = categorySchema.parse(formData)
    
    const { data, error } = await supabase
      .from("task_categories")
      .insert(validated)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/plan-semanal") // Revalidate to show new category in selectors
    revalidatePath("/configuracion") // Revalidate configuration page
    return { success: true, data, message: "Categoría creada exitosamente" }
  } catch (error: any) {
    logger.error("Error creating task category", error, 'categoryActions.createTaskCategory')
    return { success: false, message: error.message }
  }
}

// Update a category
export async function updateTaskCategory(id: string, formData: { name: string; color: string }) {
  try {
    const validated = categorySchema.parse(formData)
    
    const { data, error } = await supabase
      .from("task_categories")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    
    revalidatePath("/plan-semanal")
    revalidatePath("/configuracion") // Revalidate configuration page
    return { success: true, data, message: "Categoría actualizada exitosamente" }
  } catch (error: any) {
    logger.error("Error updating task category", { id, ...error }, 'categoryActions.updateTaskCategory')
    return { success: false, message: error.message }
  }
}

// Delete a category
export async function deleteTaskCategory(id: string) {
  try {
    const { error } = await supabase
      .from("task_categories")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/plan-semanal")
    revalidatePath("/configuracion") // Revalidate configuration page
    return { success: true, message: "Categoría eliminada exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting task category", { id, ...error }, 'categoryActions.deleteTaskCategory')
    return { success: false, message: error.message }
  }
}
