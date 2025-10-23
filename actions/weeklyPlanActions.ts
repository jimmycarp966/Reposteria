"use server"

import { supabase } from "@/lib/supabase"
import { weeklyProductionPlanSchema, weeklyProductionTaskSchema, updateTaskStatusSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { WeeklyPlanWithTasks, WeeklyProductionTask, WeeklyPlanStats } from "@/lib/types"
import { startOfWeek, addDays, format } from "date-fns"
import { es } from "date-fns/locale"

// Get weekly plan for a specific week
export async function getWeeklyPlan(weekStartDate: string) {
  try {
    logger.debug('Fetching weekly plan', { weekStartDate }, 'weeklyPlanActions.getWeeklyPlan')

    const { data, error } = await supabase
      .rpc('get_weekly_plan_with_tasks', {
        week_start_param: weekStartDate
      })

    if (error) throw error

    const result = data as { success: boolean; data?: any; message: string }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    return {
      success: true,
      data: result.data as WeeklyPlanWithTasks | null,
      message: result.message
    }
  } catch (error: any) {
    logger.error("Error fetching weekly plan", error, 'weeklyPlanActions.getWeeklyPlan')
    return { success: false, message: error.message || "Error al obtener plan semanal" }
  }
}

// Create weekly plan
export async function createWeeklyPlan(weekStartDate: string, notes?: string) {
  try {
    const validated = weeklyProductionPlanSchema.parse({
      week_start_date: weekStartDate,
      notes
    })

    logger.debug('Creating weekly plan', validated, 'weeklyPlanActions.createWeeklyPlan')

    // Calculate week end date (Sunday)
    const startDate = new Date(validated.week_start_date)
    const endDate = addDays(startDate, 6)

    const { data, error } = await supabase
      .from("weekly_production_plans")
      .insert([{
        week_start_date: validated.week_start_date,
        week_end_date: format(endDate, 'yyyy-MM-dd'),
        notes: validated.notes
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Weekly plan created successfully', { planId: data.id }, 'weeklyPlanActions.createWeeklyPlan')

    return {
      success: true,
      data,
      message: "Plan semanal creado exitosamente"
    }
  } catch (error: any) {
    logger.error("Error creating weekly plan", error, 'weeklyPlanActions.createWeeklyPlan')
    return { success: false, message: error.message || "Error al crear plan semanal" }
  }
}

// Delete weekly plan
export async function deleteWeeklyPlan(planId: string) {
  try {
    logger.debug('Deleting weekly plan', { planId }, 'weeklyPlanActions.deleteWeeklyPlan')

    const { error } = await supabase
      .from("weekly_production_plans")
      .delete()
      .eq("id", planId)

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Weekly plan deleted successfully', { planId }, 'weeklyPlanActions.deleteWeeklyPlan')

    return {
      success: true,
      message: "Plan semanal eliminado exitosamente"
    }
  } catch (error: any) {
    logger.error("Error deleting weekly plan", error, 'weeklyPlanActions.deleteWeeklyPlan')
    return { success: false, message: error.message || "Error al eliminar plan semanal" }
  }
}

// Add task to plan
export async function addTaskToPlan(
  planId: string,
  dayOfWeek: number,
  taskDescription: string,
  recipeId?: string,
  estimatedTimeMinutes?: number
) {
  try {
    const validated = weeklyProductionTaskSchema.parse({
      plan_id: planId,
      day_of_week: dayOfWeek,
      task_description: taskDescription,
      recipe_id: recipeId,
      estimated_time_minutes: estimatedTimeMinutes,
      order_position: 0 // Will be calculated
    })

    logger.debug('Adding task to plan', validated, 'weeklyPlanActions.addTaskToPlan')

    // Get the next order position for this day
    const { data: existingTasks, error: countError } = await supabase
      .from("weekly_production_tasks")
      .select("order_position")
      .eq("plan_id", planId)
      .eq("day_of_week", dayOfWeek)
      .order("order_position", { ascending: false })
      .limit(1)

    if (countError) throw countError

    const nextPosition = existingTasks && existingTasks.length > 0 
      ? (existingTasks[0].order_position + 1) 
      : 0

    const { data, error } = await supabase
      .from("weekly_production_tasks")
      .insert([{
        plan_id: planId,
        day_of_week: dayOfWeek,
        task_description: taskDescription,
        recipe_id: recipeId,
        estimated_time_minutes: estimatedTimeMinutes,
        order_position: nextPosition
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Task added to plan successfully', { taskId: data.id }, 'weeklyPlanActions.addTaskToPlan')

    return {
      success: true,
      data,
      message: "Tarea agregada exitosamente"
    }
  } catch (error: any) {
    logger.error("Error adding task to plan", error, 'weeklyPlanActions.addTaskToPlan')
    return { success: false, message: error.message || "Error al agregar tarea" }
  }
}

// Update task
export async function updateTask(
  taskId: string,
  updates: {
    task_description?: string
    recipe_id?: string | null
    estimated_time_minutes?: number | null
  }
) {
  try {
    logger.debug('Updating task', { taskId, updates }, 'weeklyPlanActions.updateTask')

    const { data, error } = await supabase
      .from("weekly_production_tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Task updated successfully', { taskId }, 'weeklyPlanActions.updateTask')

    return {
      success: true,
      data,
      message: "Tarea actualizada exitosamente"
    }
  } catch (error: any) {
    logger.error("Error updating task", error, 'weeklyPlanActions.updateTask')
    return { success: false, message: error.message || "Error al actualizar tarea" }
  }
}

// Update task status
export async function updateTaskStatus(taskId: string, status: 'pendiente' | 'en_progreso' | 'completada') {
  try {
    const validated = updateTaskStatusSchema.parse({ status })

    logger.debug('Updating task status', { taskId, status }, 'weeklyPlanActions.updateTaskStatus')

    const { data, error } = await supabase
      .from("weekly_production_tasks")
      .update({ status: validated.status })
      .eq("id", taskId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Task status updated successfully', { taskId, status }, 'weeklyPlanActions.updateTaskStatus')

    return {
      success: true,
      data,
      message: "Estado de tarea actualizado exitosamente"
    }
  } catch (error: any) {
    logger.error("Error updating task status", error, 'weeklyPlanActions.updateTaskStatus')
    return { success: false, message: error.message || "Error al actualizar estado de tarea" }
  }
}

// Delete task
export async function deleteTask(taskId: string) {
  try {
    logger.debug('Deleting task', { taskId }, 'weeklyPlanActions.deleteTask')

    const { error } = await supabase
      .from("weekly_production_tasks")
      .delete()
      .eq("id", taskId)

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Task deleted successfully', { taskId }, 'weeklyPlanActions.deleteTask')

    return {
      success: true,
      message: "Tarea eliminada exitosamente"
    }
  } catch (error: any) {
    logger.error("Error deleting task", error, 'weeklyPlanActions.deleteTask')
    return { success: false, message: error.message || "Error al eliminar tarea" }
  }
}

// Reorder tasks within a day
export async function reorderTasks(planId: string, dayOfWeek: number, taskIds: string[]) {
  try {
    logger.debug('Reordering tasks', { planId, dayOfWeek, taskIds }, 'weeklyPlanActions.reorderTasks')

    // Update order positions for all tasks in the day
    const updates = taskIds.map((taskId, index) => ({
      id: taskId,
      order_position: index
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from("weekly_production_tasks")
        .update({ order_position: update.order_position })
        .eq("id", update.id)

      if (error) throw error
    }

    revalidatePath("/plan-semanal")
    logger.info('Tasks reordered successfully', { planId, dayOfWeek }, 'weeklyPlanActions.reorderTasks')

    return {
      success: true,
      message: "Tareas reordenadas exitosamente"
    }
  } catch (error: any) {
    logger.error("Error reordering tasks", error, 'weeklyPlanActions.reorderTasks')
    return { success: false, message: error.message || "Error al reordenar tareas" }
  }
}

// Duplicate week plan
export async function duplicateWeekPlan(sourceWeekStart: string, targetWeekStart: string) {
  try {
    logger.debug('Duplicating week plan', { sourceWeekStart, targetWeekStart }, 'weeklyPlanActions.duplicateWeekPlan')

    const { data, error } = await supabase
      .rpc('duplicate_weekly_plan', {
        source_week_start: sourceWeekStart,
        target_week_start: targetWeekStart
      })

    if (error) throw error

    const result = data as { success: boolean; data?: any; message: string }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    revalidatePath("/plan-semanal")
    logger.info('Week plan duplicated successfully', result.data, 'weeklyPlanActions.duplicateWeekPlan')

    return {
      success: true,
      data: result.data,
      message: result.message
    }
  } catch (error: any) {
    logger.error("Error duplicating week plan", error, 'weeklyPlanActions.duplicateWeekPlan')
    return { success: false, message: error.message || "Error al duplicar plan semanal" }
  }
}

// Get weekly plan statistics
export async function getWeeklyPlanStats(planId: string) {
  try {
    logger.debug('Fetching weekly plan stats', { planId }, 'weeklyPlanActions.getWeeklyPlanStats')

    const { data, error } = await supabase
      .rpc('get_weekly_plan_stats', {
        plan_id_param: planId
      })

    if (error) throw error

    const result = data as { success: boolean; data?: WeeklyPlanStats; message: string }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    return {
      success: true,
      data: result.data,
      message: result.message
    }
  } catch (error: any) {
    logger.error("Error fetching weekly plan stats", error, 'weeklyPlanActions.getWeeklyPlanStats')
    return { success: false, message: error.message || "Error al obtener estadísticas del plan" }
  }
}

