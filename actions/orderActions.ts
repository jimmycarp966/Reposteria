"use server"

import { supabase } from "@/lib/supabase"
import { orderSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { get_current_date } from "@/lib/utils"
import { addMinutes, parseISO } from "date-fns"
import { clearRelevantCache } from "@/lib/cache-utils"
import { checkSupabaseConnection, getMockUpcomingOrders } from "@/lib/supabase-fallback"

export async function getOrders(status?: string) {
  try {
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (
            id,
            name,
            image_url
          )
        )
      `)
      .order("delivery_date", { ascending: true })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return { success: false, message: error.message || "Error al obtener pedidos" }
  }
}

export async function getOrderById(id: string) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (
            id,
            name,
            sku,
            image_url
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching order:", error)
    return { success: false, message: error.message || "Error al obtener pedido" }
  }
}

export async function createOrder(formData: z.infer<typeof orderSchema>) {
  try {
    const validated = orderSchema.parse(formData)

    // Calculate totals
    let totalCost = 0
    let totalPrice = 0
    let totalProductionTime = 0

    for (const item of validated.items) {
      totalCost += item.cost_at_sale * item.quantity
      totalPrice += item.unit_price * item.quantity
      totalProductionTime += item.production_time_estimate_minutes * item.quantity
    }

    // Calculate production start time
    const deliveryDateTime = validated.delivery_time 
      ? new Date(`${validated.delivery_date}T${validated.delivery_time}`)
      : new Date(`${validated.delivery_date}T12:00:00`)

    // Get buffer setting
    const { data: bufferSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "production_buffer_minutes")
      .single()

    const bufferMinutes = bufferSetting ? parseInt(bufferSetting.value) : 120
    const calculatedBuffer = Math.max(totalProductionTime * 0.1, bufferMinutes)
    
    const productionStart = addMinutes(deliveryDateTime, -(totalProductionTime + calculatedBuffer))

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        type: validated.type,
        delivery_date: validated.delivery_date,
        delivery_time: validated.delivery_time,
        total_cost: totalCost,
        total_price: totalPrice,
        production_start: productionStart.toISOString(),
        notes: validated.notes,
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const itemsToInsert = validated.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_at_sale: item.cost_at_sale,
      production_time_estimate_minutes: item.production_time_estimate_minutes,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    revalidatePath("/pedidos")
    revalidatePath("/calendario")
    clearRelevantCache('order') // Limpiar caché relacionado con pedidos
    return { success: true, data: order, message: "Pedido creado exitosamente" }
  } catch (error: any) {
    console.error("Error creating order:", error)
    return { success: false, message: error.message || "Error al crear pedido" }
  }
}

export async function confirmOrder(id: string) {
  try {
    // Call RPC function to confirm order and update stock
    const { data, error } = await supabase
      .rpc("confirm_order_and_update_stock", { order_id_param: id })

    if (error) throw error

    const result = data as { success: boolean; message: string; shortages?: any[] }

    if (!result.success) {
      return { 
        success: false, 
        message: result.message,
        shortages: result.shortages 
      }
    }

    revalidatePath("/pedidos")
    revalidatePath("/inventario")
    revalidatePath("/produccion")
    clearRelevantCache('order') // Limpiar caché relacionado con pedidos
    clearRelevantCache('inventory') // Limpiar caché de inventario
    return { success: true, message: result.message }
  } catch (error: any) {
    console.error("Error confirming order:", error)
    return { success: false, message: error.message || "Error al confirmar pedido" }
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const validStatuses = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "COMPLETED", "CANCELLED"]
    
    if (!validStatuses.includes(status)) {
      return { success: false, message: "Estado inválido" }
    }

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/pedidos")
    revalidatePath("/produccion")
    return { success: true, message: "Estado actualizado exitosamente" }
  } catch (error: any) {
    console.error("Error updating order status:", error)
    return { success: false, message: error.message || "Error al actualizar estado" }
  }
}

export async function cancelOrder(id: string) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "CANCELLED" })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/pedidos")
    return { success: true, message: "Pedido cancelado exitosamente" }
  } catch (error: any) {
    console.error("Error cancelling order:", error)
    return { success: false, message: error.message || "Error al cancelar pedido" }
  }
}

export async function checkStockAvailability(orderId: string) {
  try {
    const { data, error } = await supabase
      .rpc("check_stock_availability", { order_id_param: orderId })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error checking stock availability:", error)
    return { success: false, message: error.message || "Error al verificar stock" }
  }
}

export async function getUpcomingOrders(days: number = 7) {
  try {
    // Verificar conexión a Supabase
    const hasConnection = await checkSupabaseConnection()
    
    if (!hasConnection) {
      console.log("📡 Sin conexión a Supabase, usando datos de ejemplo")
      return {
        success: true,
        data: getMockUpcomingOrders()
      }
    }

    const today = get_current_date()
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)

    // Consulta optimizada: solo campos necesarios y limitar resultados
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        type,
        status,
        delivery_date,
        delivery_time,
        total_cost,
        total_price,
        notes,
        order_items (
          id,
          quantity,
          unit_price,
          product:products (
            name
          )
        )
      `)
      .gte("delivery_date", today.toISOString().split("T")[0])
      .lte("delivery_date", futureDate.toISOString().split("T")[0])
      .in("status", ["PENDING", "CONFIRMED", "IN_PRODUCTION"])
      .order("delivery_date")
      .limit(20) // Limitar a 20 pedidos para mejorar rendimiento

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching upcoming orders:", error)
    // En caso de error, usar datos de ejemplo
    return {
      success: true,
      data: getMockUpcomingOrders()
    }
  }
}



