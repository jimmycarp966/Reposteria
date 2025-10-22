"use server"

import { supabase } from "@/lib/supabase"
import { settingSchema, eventSchema, priceRuleSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logger } from "@/lib/logger"

// Settings
export async function getSetting(key: string) {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single()

    if (error) throw error

    return { success: true, data: data.value }
  } catch (error: any) {
    logger.error("Error fetching setting", error, 'settingsActions.getSetting')
    return { success: false, message: error.message || "Error al obtener configuración" }
  }
}

export async function getAllSettings() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("key")

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching settings", error, 'settingsActions.getSettings')
    return { success: false, message: error.message || "Error al obtener configuraciones" }
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const validated = settingSchema.parse({ key, value })

    const { error } = await supabase
      .from("settings")
      .upsert({ key: validated.key, value: validated.value })

    if (error) throw error

    revalidatePath("/configuracion")
    return { success: true, message: "Configuración actualizada exitosamente" }
  } catch (error: any) {
    logger.error("Error updating setting", error, 'settingsActions.updateSetting')
    return { success: false, message: error.message || "Error al actualizar configuración" }
  }
}

// Events
export async function getEvents() {
  try {
    const { data, error } = await supabase
      .from("events_calendar")
      .select("*")
      .order("date")

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching events", error, 'settingsActions.getEvents')
    return { success: false, message: error.message || "Error al obtener eventos" }
  }
}

export async function getEventById(id: string) {
  try {
    const { data, error } = await supabase
      .from("events_calendar")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching event", error, 'settingsActions.getEventById')
    return { success: false, message: error.message || "Error al obtener evento" }
  }
}

export async function createEvent(formData: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(formData)

    const { data, error } = await supabase
      .from("events_calendar")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/configuracion")
    revalidatePath("/calendario")
    return { success: true, data, message: "Evento creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating event", error, 'settingsActions.createEvent')
    return { success: false, message: error.message || "Error al crear evento" }
  }
}

export async function updateEvent(id: string, formData: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(formData)

    const { data, error } = await supabase
      .from("events_calendar")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/configuracion")
    revalidatePath("/calendario")
    return { success: true, data, message: "Evento actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating event", error, 'settingsActions.updateEvent')
    return { success: false, message: error.message || "Error al actualizar evento" }
  }
}

export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase
      .from("events_calendar")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/configuracion")
    revalidatePath("/calendario")
    return { success: true, message: "Evento eliminado exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting event", error, 'settingsActions.deleteEvent')
    return { success: false, message: error.message || "Error al eliminar evento" }
  }
}

// Price Rules
export async function getPriceRules() {
  try {
    const { data, error } = await supabase
      .from("price_rules")
      .select(`
        *,
        event:events_calendar (
          id,
          name,
          date
        )
      `)
      .order("effective_from", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching price rules", error, 'settingsActions.getPriceRules')
    return { success: false, message: error.message || "Error al obtener reglas de precio" }
  }
}

export async function createPriceRule(formData: z.infer<typeof priceRuleSchema>) {
  try {
    const validated = priceRuleSchema.parse(formData)

    const { data, error } = await supabase
      .from("price_rules")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/configuracion")
    return { success: true, data, message: "Regla de precio creada exitosamente" }
  } catch (error: any) {
    logger.error("Error creating price rule", error, 'settingsActions.createPriceRule')
    return { success: false, message: error.message || "Error al crear regla de precio" }
  }
}

export async function updatePriceRule(id: string, formData: z.infer<typeof priceRuleSchema>) {
  try {
    const validated = priceRuleSchema.parse(formData)

    const { data, error } = await supabase
      .from("price_rules")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/configuracion")
    return { success: true, data, message: "Regla de precio actualizada exitosamente" }
  } catch (error: any) {
    logger.error("Error updating price rule", error, 'settingsActions.updatePriceRule')
    return { success: false, message: error.message || "Error al actualizar regla de precio" }
  }
}

export async function deletePriceRule(id: string) {
  try {
    const { error } = await supabase
      .from("price_rules")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/configuracion")
    return { success: true, message: "Regla de precio eliminada exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting price rule", error, 'settingsActions.deletePriceRule')
    return { success: false, message: error.message || "Error al eliminar regla de precio" }
  }
}



