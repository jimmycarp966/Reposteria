"use server"

import { supabase } from "@/lib/supabase"
import { inventoryUpdateSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { checkSupabaseConnection, getMockLowStockIngredients } from "@/lib/supabase-fallback"

export async function getInventory() {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        *,
        ingredient:ingredients (
          id,
          name,
          unit,
          cost_per_unit
        )
      `)
      .order("last_updated", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching inventory:", error)
    return { success: false, message: error.message || "Error al obtener inventario" }
  }
}

export async function getLowStockIngredients(threshold: number = 10) {
  try {
    // Verificar conexión a Supabase
    const hasConnection = await checkSupabaseConnection()
    
    if (!hasConnection) {
      console.log("📡 Sin conexión a Supabase, usando datos de ejemplo")
      return {
        success: true,
        data: getMockLowStockIngredients()
      }
    }

    // Consulta optimizada: solo campos necesarios y limitar resultados
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        id,
        quantity,
        unit,
        location,
        last_updated,
        ingredient:ingredients (
          id,
          name,
          unit
        )
      `)
      .lt("quantity", threshold)
      .order("quantity")
      .limit(15) // Limitar a 15 ingredientes para mejorar rendimiento

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching low stock ingredients:", error)
    // En caso de error, usar datos de ejemplo
    return {
      success: true,
      data: getMockLowStockIngredients()
    }
  }
}

export async function updateStock(formData: z.infer<typeof inventoryUpdateSchema>) {
  try {
    const validated = inventoryUpdateSchema.parse(formData)

    // Get current inventory
    const { data: currentInventory, error: fetchError } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("ingredient_id", validated.ingredient_id)
      .single()

    if (fetchError) throw fetchError

    // Calculate new quantity
    let newQuantity = currentInventory.quantity
    if (validated.type === "IN") {
      newQuantity += validated.quantity
    } else {
      newQuantity -= validated.quantity
      if (newQuantity < 0) {
        return { success: false, message: "No hay suficiente stock para descontar" }
      }
    }

    // Update inventory
    const { error: updateError } = await supabase
      .from("inventory")
      .update({ 
        quantity: newQuantity,
        last_updated: new Date().toISOString()
      })
      .eq("ingredient_id", validated.ingredient_id)

    if (updateError) throw updateError

    // Record movement
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert([{
        ingredient_id: validated.ingredient_id,
        quantity: validated.type === "IN" ? validated.quantity : -validated.quantity,
        type: validated.type,
        notes: validated.notes,
      }])

    if (movementError) throw movementError

    revalidatePath("/ingredientes")
    revalidatePath("/inventario")
    return { success: true, message: "Stock actualizado exitosamente" }
  } catch (error: any) {
    console.error("Error updating stock:", error)
    return { success: false, message: error.message || "Error al actualizar stock" }
  }
}

export async function getStockMovements(ingredientId?: string, limit: number = 50) {
  try {
    let query = supabase
      .from("inventory_movements")
      .select(`
        *,
        ingredient:ingredients (
          id,
          name,
          unit
        ),
        order:orders (
          id,
          delivery_date
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (ingredientId) {
      query = query.eq("ingredient_id", ingredientId)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching stock movements:", error)
    return { success: false, message: error.message || "Error al obtener movimientos" }
  }
}

export async function setInventoryLocation(ingredientId: string, location: string) {
  try {
    const { error } = await supabase
      .from("inventory")
      .update({ location })
      .eq("ingredient_id", ingredientId)

    if (error) throw error

    revalidatePath("/ingredientes")
    return { success: true, message: "Ubicación actualizada exitosamente" }
  } catch (error: any) {
    console.error("Error updating location:", error)
    return { success: false, message: error.message || "Error al actualizar ubicación" }
  }
}



