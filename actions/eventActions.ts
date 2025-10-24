"use server"

import { supabase } from "@/lib/supabase"
import { eventProductSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { EventProductWithDetails, EventWithProducts, EventSalesStats } from "@/lib/types"

// Get events with their products
export async function getEventsWithProducts() {
  try {
    const { data, error } = await supabase
      .from("events_calendar")
      .select(`
        *,
        event_products(
          *,
          product:products(id, name, image_url, suggested_price_cache)
        )
      `)
      .order("date")

    if (error) throw error

    return { success: true, data: data as EventWithProducts[] }
  } catch (error: any) {
    logger.error("Error fetching events with products", error, 'eventActions.getEventsWithProducts')
    return { success: false, message: error.message || "Error al obtener eventos" }
  }
}

// Get products for a specific event
export async function getEventProducts(eventId: string) {
  try {
    const { data, error } = await supabase
      .from("event_products")
      .select(`
        *,
        product:products(id, name, image_url, suggested_price_cache)
      `)
      .eq("event_id", eventId)
      .order("created_at")

    if (error) throw error

    return { success: true, data: data as EventProductWithDetails[] }
  } catch (error: any) {
    logger.error("Error fetching event products", error, 'eventActions.getEventProducts')
    return { success: false, message: error.message || "Error al obtener productos del evento" }
  }
}

// Add product to event
export async function addProductToEvent(eventId: string, productId: string, specialPrice?: number) {
  try {
    const validated = eventProductSchema.parse({
      event_id: eventId,
      product_id: productId,
      special_price: specialPrice
    })

    const { data, error } = await supabase
      .from("event_products")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/calendario")
    return { success: true, data, message: "Producto agregado al evento exitosamente" }
  } catch (error: any) {
    logger.error("Error adding product to event", error, 'eventActions.addProductToEvent')
    return { success: false, message: error.message || "Error al agregar producto al evento" }
  }
}

// Remove product from event
export async function removeProductFromEvent(eventProductId: string) {
  try {
    const { error } = await supabase
      .from("event_products")
      .delete()
      .eq("id", eventProductId)

    if (error) throw error

    revalidatePath("/calendario")
    return { success: true, message: "Producto removido del evento exitosamente" }
  } catch (error: any) {
    logger.error("Error removing product from event", error, 'eventActions.removeProductFromEvent')
    return { success: false, message: error.message || "Error al remover producto del evento" }
  }
}

// Update event product price
export async function updateEventProductPrice(eventProductId: string, price: number) {
  try {
    const { data, error } = await supabase
      .from("event_products")
      .update({ special_price: price })
      .eq("id", eventProductId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/calendario")
    return { success: true, data, message: "Precio actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating event product price", error, 'eventActions.updateEventProductPrice')
    return { success: false, message: error.message || "Error al actualizar precio" }
  }
}

// Get event sales statistics
export async function getEventSalesStats(eventId: string) {
  try {
    const { data, error } = await supabase.rpc('get_event_sales_stats', {
      event_id_param: eventId
    })

    if (error) throw error

    return { success: true, data: data as EventSalesStats }
  } catch (error: any) {
    logger.error("Error fetching event sales stats", error, 'eventActions.getEventSalesStats')
    return { success: false, message: error.message || "Error al obtener estadísticas del evento" }
  }
}

// Get today's events with products
export async function getTodaysEventsWithProducts() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from("events_calendar")
      .select(`
        *,
        event_products(
          *,
          product:products(id, name, image_url, suggested_price_cache)
        )
      `)
      .eq("date", today)
      .order("name")

    if (error) throw error

    return { success: true, data: data as EventWithProducts[] }
  } catch (error: any) {
    logger.error("Error fetching today's events", error, 'eventActions.getTodaysEventsWithProducts')
    return { success: false, message: error.message || "Error al obtener eventos del día" }
  }
}

// Get events for a specific date
export async function getEventsByDate(date: string) {
  try {
    const { data, error } = await supabase
      .from("events_calendar")
      .select(`
        *,
        event_products(
          *,
          product:products(id, name, image_url, suggested_price_cache)
        )
      `)
      .eq("date", date)
      .order("name")

    if (error) throw error

    return { success: true, data: data as EventWithProducts[] }
  } catch (error: any) {
    logger.error("Error fetching events by date", error, 'eventActions.getEventsByDate')
    return { success: false, message: error.message || "Error al obtener eventos" }
  }
}

// Get products available for events (not already in this event)
export async function getAvailableProductsForEvent(eventId: string) {
  try {
    // Get products that are NOT already in this event
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("id", "in", `(
        SELECT product_id 
        FROM event_products 
        WHERE event_id = '${eventId}'
      )`)
      .order("name")

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching available products", error, 'eventActions.getAvailableProductsForEvent')
    return { success: false, message: error.message || "Error al obtener productos disponibles" }
  }
}



