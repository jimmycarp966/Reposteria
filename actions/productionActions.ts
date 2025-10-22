"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export async function getProductionTasks(status?: string) {
  try {
    logger.debug('Fetching production tasks', { status }, 'productionActions.getProductionTasks')

    let query = supabase
      .from("production_tasks")
      .select(`
        *,
        order_item:order_items (
          *,
          order:orders (
            id,
            delivery_date,
            delivery_time,
            status
          ),
          product:products (
            id,
            name
          )
        )
      `)
      .order("start_time", { ascending: true })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    logger.info(`Fetched ${data?.length || 0} production tasks`, null, 'productionActions.getProductionTasks')
    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching production tasks", error, 'productionActions.getProductionTasks')
    return { success: false, message: error.message || "Error al obtener tareas de producción" }
  }
}

export async function updateTaskStatus(id: string, status: string) {
  try {
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"]
    
    if (!validStatuses.includes(status)) {
      logger.warn('Invalid task status attempted', { id, status }, 'productionActions.updateTaskStatus')
      return { success: false, message: "Estado inválido" }
    }

    const { error } = await supabase
      .from("production_tasks")
      .update({ status })
      .eq("id", id)

    if (error) throw error

    logger.info('Task status updated', { id, status }, 'productionActions.updateTaskStatus')
    revalidatePath("/produccion")
    return { success: true, message: "Estado actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating task status", error, 'productionActions.updateTaskStatus')
    return { success: false, message: error.message || "Error al actualizar estado" }
  }
}

export async function updateTaskDuration(id: string, duration: number) {
  try {
    if (duration < 0) {
      logger.warn('Invalid task duration', { id, duration }, 'productionActions.updateTaskDuration')
      return { success: false, message: "La duración debe ser mayor o igual a 0" }
    }

    const { error } = await supabase
      .from("production_tasks")
      .update({ duration_minutes: duration })
      .eq("id", id)

    if (error) throw error

    logger.info('Task duration updated', { id, duration }, 'productionActions.updateTaskDuration')
    revalidatePath("/produccion")
    return { success: true, message: "Duración actualizada exitosamente" }
  } catch (error: any) {
    logger.error("Error updating task duration", error, 'productionActions.updateTaskDuration')
    return { success: false, message: error.message || "Error al actualizar duración" }
  }
}

