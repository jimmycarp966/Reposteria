"use server"

import { supabase } from "@/lib/supabase"
import { saleSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import { getTodayGMT3 } from "@/lib/utils"
import type { SalesQueryParams, SaleWithItems, DailySalesStats } from "@/lib/types"

// Get sales with filters
export async function getSales(params: SalesQueryParams = {}) {
  try {
    let query = supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name),
        sale_items(
          *,
          product:products(id, name, image_url)
        )
      `)
      .order("sale_date", { ascending: false })

    // Apply filters
    if (params.dateFrom) {
      query = query.gte("sale_date", params.dateFrom)
    }
    if (params.dateTo) {
      query = query.lte("sale_date", params.dateTo)
    }
    if (params.customerId) {
      query = query.eq("customer_id", params.customerId)
    }
    if (params.paymentMethod) {
      query = query.eq("payment_method", params.paymentMethod)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data as SaleWithItems[] }
  } catch (error: any) {
    logger.error("Error fetching sales", error, 'saleActions.getSales')
    return { success: false, message: error.message || "Error al obtener ventas" }
  }
}

// Get sale by ID
export async function getSaleById(id: string) {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name, email, phone),
        sale_items(
          *,
          product:products(id, name, image_url, suggested_price_cache)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data: data as SaleWithItems }
  } catch (error: any) {
    logger.error("Error fetching sale", error, 'saleActions.getSaleById')
    return { success: false, message: error.message || "Error al obtener venta" }
  }
}

// Create sale with items
export async function createSale(formData: any) {
  try {
    const validated = saleSchema.parse(formData)

    // Prepare items for the RPC function
    const saleItemsData = validated.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))

    // Call RPC function to create sale atomically
    const { data, error } = await supabase.rpc('create_sale_with_items', {
      sale_date_param: validated.sale_date,
      sale_items_param: saleItemsData, // Enviar como array directamente, no como string
      customer_id_param: validated.customer_id || null,
      payment_method_param: validated.payment_method,
      notes_param: validated.notes || null
    })

    if (error) {
      throw error
    }

    if (!data.success) {
      return { success: false, message: data.message || "Error al crear venta" }
    }

    revalidatePath("/ventas")
    return { 
      success: true, 
      data: { saleId: data.sale_id, totalAmount: data.total_amount },
      message: data.message 
    }
  } catch (error: any) {
    logger.error("Error creating sale", error, 'saleActions.createSale')
    return { success: false, message: error.message || "Error al crear venta" }
  }
}

// Get sales by date range
export async function getSalesByDateRange(from: string, to: string) {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name),
        sale_items(
          *,
          product:products(id, name, image_url)
        )
      `)
      .gte("sale_date", from)
      .lte("sale_date", to)
      .order("sale_date", { ascending: false })

    if (error) throw error

    return { success: true, data: data as SaleWithItems[] }
  } catch (error: any) {
    logger.error("Error fetching sales by date range", error, 'saleActions.getSalesByDateRange')
    return { success: false, message: error.message || "Error al obtener ventas" }
  }
}

// Get sales by event date
export async function getSalesByEvent(eventId: string) {
  try {
    // First get the event date
    const { data: event, error: eventError } = await supabase
      .from("events_calendar")
      .select("date")
      .eq("id", eventId)
      .single()

    if (eventError) throw eventError

    // Then get sales for that date
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name),
        sale_items(
          *,
          product:products(id, name, image_url)
        )
      `)
      .eq("sale_date", event.date)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data as SaleWithItems[] }
  } catch (error: any) {
    logger.error("Error fetching sales by event", error, 'saleActions.getSalesByEvent')
    return { success: false, message: error.message || "Error al obtener ventas" }
  }
}

// Get daily sales statistics
export async function getDailySalesStats(date: string) {
  try {
    const { data, error } = await supabase.rpc('get_daily_sales_stats', {
      date_param: date
    })

    if (error) throw error

    return { success: true, data: data as DailySalesStats }
  } catch (error: any) {
    logger.error("Error fetching daily sales stats", error, 'saleActions.getDailySalesStats')
    return { success: false, message: error.message || "Error al obtener estadísticas" }
  }
}

// Get today's sales
export async function getTodaysSales() {
  try {
    const today = getTodayGMT3()
    
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name),
        sale_items(
          *,
          product:products(id, name, image_url)
        )
      `)
      .eq("sale_date", today)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data as SaleWithItems[] }
  } catch (error: any) {
    logger.error("Error fetching today's sales", error, 'saleActions.getTodaysSales')
    return { success: false, message: error.message || "Error al obtener ventas del día" }
  }
}

// Register payment for a sale
export async function registerSalePayment(saleId: string, amount: number) {
  try {
    const { data, error } = await supabase
      .rpc('register_payment', {
        table_name_param: 'sales',
        record_id_param: saleId,
        payment_amount_param: amount
      })

    if (error) throw error

    const result = data as { success: boolean; message: string; data?: any }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    revalidatePath("/ventas")
    revalidatePath("/reportes")
    return { success: true, message: result.message, data: result.data }
  } catch (error: any) {
    logger.error("Error registering sale payment", error, 'saleActions.registerSalePayment')
    return { success: false, message: error.message || "Error al registrar pago" }
  }
}

// Get sales with pending payments
export async function getSalesWithPendingPayment() {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name)
      `)
      .in('payment_status', ['pendiente', 'parcial'])
      .order('sale_date')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    logger.error("Error fetching sales with pending payment", error, 'saleActions.getSalesWithPendingPayment')
    return { success: false, message: error.message || "Error al obtener ventas pendientes" }
  }
}