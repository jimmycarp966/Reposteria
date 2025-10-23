"use server"

import { supabase } from "@/lib/supabase"
import { weeklyProductionPlanSchema, weeklyProductionTaskSchema, updateTaskStatusSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { WeeklyPlanWithTasks, WeeklyProductionTask, WeeklyPlanStats } from "@/lib/types"
import { startOfWeek, addDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { formatDate } from "@/lib/utils"

// Get all weekly plans
export async function getAllWeeklyPlans() {
  try {
    logger.debug('Fetching all weekly plans', {}, 'weeklyPlanActions.getAllWeeklyPlans')

    const { data, error } = await supabase
      .from("weekly_production_plans")
      .select("*")
      .order("week_start_date", { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
      message: "Planes semanales obtenidos exitosamente"
    }
  } catch (error: any) {
    logger.error("Error fetching all weekly plans", error, 'weeklyPlanActions.getAllWeeklyPlans')
    return { success: false, message: error.message || "Error al obtener planes semanales" }
  }
}

// Get weekly plan for a specific week
export async function getWeeklyPlan(weekStartDate: string) {
  try {
    logger.debug('Fetching weekly plan', { weekStartDate }, 'weeklyPlanActions.getWeeklyPlan')

    // Primero intentar con la función RPC
    try {
      const { data, error } = await supabase
        .rpc('get_weekly_plan_with_tasks', {
          week_start_param: weekStartDate
        })

      if (error) {
        console.log('RPC error, trying direct query:', error)
        throw error
      }

      const result = data as { success: boolean; data?: any; message: string }

      if (!result.success) {
        return { success: false, message: result.message }
      }

      return {
        success: true,
        data: result.data as WeeklyPlanWithTasks | null,
        message: result.message
      }
    } catch (rpcError) {
      console.log('RPC failed, using direct query:', rpcError)
      
      // Fallback: consulta directa a la tabla
      const { data: planData, error: planError } = await supabase
        .from("weekly_production_plans")
        .select("*")
        .eq("week_start_date", weekStartDate)
        .single()

      if (planError) {
        if (planError.code === 'PGRST116') {
          // No plan found
          return { success: true, data: null, message: "No hay plan para esta semana" }
        }
        throw planError
      }

      // Obtener tareas del plan
      const { data: tasksData, error: tasksError } = await supabase
        .from("weekly_production_tasks")
        .select(`
          *,
          recipe:recipes (
            id,
            name,
            image_url
          )
        `)
        .eq("plan_id", planData.id)
        .order("day_of_week", { ascending: true })
        .order("order_position", { ascending: true })

      if (tasksError) {
        console.log('Error fetching tasks:', tasksError)
      }

      const planWithTasks: WeeklyPlanWithTasks = {
        ...planData,
        tasks: tasksData || []
      }

      return {
        success: true,
        data: planWithTasks,
        message: "Plan semanal obtenido exitosamente"
      }
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

    // Verificar si ya existe un plan para esta semana
    const { data: existingPlan, error: checkError } = await supabase
      .from("weekly_production_plans")
      .select("id, week_start_date")
      .eq("week_start_date", validated.week_start_date)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingPlan) {
      return { 
        success: false, 
        message: `Ya existe un plan para la semana del ${formatDate(validated.week_start_date)}` 
      }
    }

    // Calculate week end date (Sunday) - ensure proper timezone handling
    const startDate = new Date(validated.week_start_date + 'T00:00:00Z')
    const endDate = addDays(startDate, 6)

    // Verificar que las fechas sean correctas
    if (startDate.getUTCDay() !== 1) {
      throw new Error(`La fecha de inicio debe ser lunes, pero es día ${startDate.getUTCDay()}`)
    }
    
    if (endDate.getUTCDay() !== 0) {
      throw new Error(`La fecha de fin debe ser domingo, pero es día ${endDate.getUTCDay()}`)
    }

    // Debug: verificar las fechas calculadas
    console.log('Debug weekly plan dates:')
    console.log('week_start_date:', validated.week_start_date)
    console.log('startDate:', startDate)
    console.log('endDate:', endDate)
    console.log('formatted endDate:', format(endDate, 'yyyy-MM-dd'))
    console.log('startDate day of week:', startDate.getUTCDay())
    console.log('endDate day of week:', endDate.getUTCDay())

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
  estimatedTimeMinutes?: number,
  categoryId?: string
) {
  try {
    const validated = weeklyProductionTaskSchema.parse({
      plan_id: planId,
      day_of_week: dayOfWeek,
      task_description: taskDescription,
      recipe_id: recipeId,
      estimated_time_minutes: estimatedTimeMinutes,
      category_id: categoryId,
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
        order_position: nextPosition,
        category_id: categoryId
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
    category_id?: string | null
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

// Reorder tasks within a day or move between days
export async function reorderTasks(tasksToUpdate: { id: string; day_of_week: number; order_position: number }[]) {
  try {
    logger.debug('Reordering tasks', { tasks: tasksToUpdate }, 'weeklyPlanActions.reorderTasks')

    // Using a transaction to ensure all updates succeed or none do
    const { error } = await supabase.rpc('update_tasks_order', {
      tasks: tasksToUpdate
    })

    if (error) throw error

    revalidatePath("/plan-semanal")
    logger.info('Tasks reordered successfully', {}, 'weeklyPlanActions.reorderTasks')

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
        source_week_start_param: sourceWeekStart,
        target_week_start_param: targetWeekStart
      })

    if (error) throw error

    // La función RPC ahora devuelve un objeto JSON con { success, message, data }
    const result = data as { success: boolean; data?: any; message: string }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    revalidatePath("/plan-semanal")
    logger.info('Week plan duplicated successfully', { newPlan: result.data }, 'weeklyPlanActions.duplicateWeekPlan')

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

// Check stock for a weekly plan
export async function checkStockForPlan(planId: string) {
  try {
    logger.debug('Checking stock for plan', { planId }, 'weeklyPlanActions.checkStockForPlan')

    const { data, error } = await supabase
      .rpc('check_stock_for_plan', {
        plan_id_param: planId
      })

    if (error) throw error

    return {
      success: true,
      data: data || [], // Returns an array of ingredients with shortages
      message: "Verificación de stock completada."
    }
  } catch (error: any) {
    logger.error("Error checking stock for plan", error, 'weeklyPlanActions.checkStockForPlan')
    return { success: false, message: error.message || "Error al verificar el stock" }
  }
}

// Get task suggestions based on orders for the week
export async function getTaskSuggestions(weekStartDate: string, weekEndDate: string) {
  try {
    logger.debug('Getting task suggestions', { weekStartDate, weekEndDate }, 'weeklyPlanActions.getTaskSuggestions')

    // Find all products from confirmed orders within the week
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        product:products (
          id,
          name,
          recipe_id
        )
      `)
      .in('orders.status', ['CONFIRMED', 'IN_PRODUCTION'])
      .gte('orders.delivery_date', weekStartDate)
      .lte('orders.delivery_date', weekEndDate)

    if (error) throw error

    // Process the data to create suggestions
    const suggestions: { [key: string]: { name: string, recipe_id: string, quantity: number } } = {};
    
    data.forEach((item: any) => {
      if (item.product && item.product.recipe_id) {
        const { recipe_id, name } = item.product;
        if (suggestions[recipe_id]) {
          suggestions[recipe_id].quantity += item.quantity;
        } else {
          suggestions[recipe_id] = {
            name: `Producir ${name}`,
            recipe_id: recipe_id,
            quantity: item.quantity
          };
        }
      }
    });

    const suggestionList = Object.values(suggestions).map(s => ({
      ...s,
      // Suggested name includes total quantity
      name: `${s.name} (x${s.quantity})`
    }));

    return {
      success: true,
      data: suggestionList,
      message: "Sugerencias de tareas obtenidas exitosamente."
    }
  } catch (error: any) {
    logger.error("Error getting task suggestions", error, 'weeklyPlanActions.getTaskSuggestions')
    return { success: false, message: error.message || "Error al obtener sugerencias de tareas" }
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

