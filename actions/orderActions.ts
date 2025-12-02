"use server"

import { supabase } from "@/lib/supabase"
import { orderSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentDateGMT3, createDateGMT3, getDateStringGMT3 } from "@/lib/utils"
import { addMinutes, parseISO } from "date-fns"
import { clearRelevantCache } from "@/lib/cache-utils"
import { checkSupabaseConnection, getMockUpcomingOrders, getFallbackData } from "@/lib/supabase-fallback"
import { logger } from "@/lib/logger"
import { sendNewOrderNotification, sendOrderStatusNotification } from "@/lib/notification-service"
import type { OrdersQueryParams, PaginatedResponse, OrderWithItems } from "@/lib/types"

export async function getOrders(params: OrdersQueryParams = {}): Promise<PaginatedResponse<OrderWithItems>> {
  const {
    status,
    page = 1,
    pageSize = 20,
    sortBy = 'delivery_date',
    sortOrder = 'asc'
  } = params

  try {
    logger.debug('Fetching orders', params, 'orderActions.getOrders')

    // Check if Supabase is available, otherwise use fallback data
    const isSupabaseAvailable = await checkSupabaseConnection()

    if (!isSupabaseAvailable) {
      logger.info('Using fallback data for orders', {}, 'orderActions.getOrders')
      const mockOrders = getFallbackData('orders') as any[]

      // Apply status filter if provided
      let filteredOrders = status ? mockOrders.filter(order => order.status === status) : mockOrders

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedOrders = filteredOrders.slice(from, to)

      return {
        success: true,
        data: paginatedOrders,
        pagination: {
          page,
          pageSize,
          total: filteredOrders.length,
          totalPages: Math.ceil(filteredOrders.length / pageSize)
        }
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

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
      `, { count: 'exact' })
      .range(from, to)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) throw error

    logger.info(`Fetched ${data?.length || 0} orders`, { count }, 'orderActions.getOrders')

    return {
      success: true,
      data: data as OrderWithItems[],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error: any) {
    logger.error("Error fetching orders", error, 'orderActions.getOrders')
    return { success: false, message: error.message || "Error al obtener pedidos" }
  }
}

export async function getOrderById(id: string) {
  try {
    logger.debug('Fetching order by ID', { id }, 'orderActions.getOrderById')

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

    logger.info('Order fetched successfully', { orderId: id }, 'orderActions.getOrderById')
    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching order", error, 'orderActions.getOrderById')
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
      ? createDateGMT3(validated.delivery_date, validated.delivery_time)
      : createDateGMT3(validated.delivery_date, "12:00:00")

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
        payment_status: 'pendiente',
        amount_paid: 0,
        amount_pending: totalPrice,
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
    clearRelevantCache('order')
    
    // Enviar notificación de nuevo pedido
    try {
      await sendNewOrderNotification({
        id: order.id,
        customer_name: order.customer_name,
        total_price: order.total_price,
        delivery_date: order.delivery_date,
        delivery_time: order.delivery_time
      })
    } catch (notificationError) {
      // No fallar la creación del pedido si falla la notificación
      console.error('Error al enviar notificación de nuevo pedido:', notificationError)
    }
    
    return { success: true, data: order, message: "Pedido creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating order", error, 'orderActions.createOrder')
    return { success: false, message: error.message || "Error al crear pedido" }
  }
}

export async function confirmOrder(id: string, forceConfirm: boolean = false) {
  try {
    // Call RPC function to confirm order and update stock
    const { data, error } = await supabase
      .rpc("confirm_order_and_update_stock", { 
        order_id_param: id,
        force_confirm_param: forceConfirm
      })

    if (error) throw error

    const result = data as { 
      success: boolean; 
      message: string; 
      shortages?: any[];
      has_shortages?: boolean;
    }

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
    clearRelevantCache('order')
    clearRelevantCache('inventory')
    
    return { 
      success: true, 
      message: result.message,
      has_shortages: result.has_shortages || false
    }
  } catch (error: any) {
    logger.error("Error confirming order", error, 'orderActions.confirmOrder')
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
    
    // Obtener datos del pedido para la notificación
    const { data: orderData } = await supabase
      .from("orders")
      .select("customer_name, delivery_date")
      .eq("id", id)
      .single()
    
    // Enviar notificación de cambio de estado
    if (orderData) {
      try {
        await sendOrderStatusNotification({
          id,
          customer_name: orderData.customer_name,
          status: status,
          delivery_date: orderData.delivery_date
        })
      } catch (notificationError) {
        // No fallar la actualización si falla la notificación
        console.error('Error al enviar notificación de cambio de estado:', notificationError)
      }
    }
    
    return { success: true, message: "Estado actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating order status", error, 'orderActions.updateOrderStatus')
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
    logger.error("Error cancelling order", error, 'orderActions.cancelOrder')
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
    logger.error("Error checking stock availability", error, 'orderActions.checkStockAvailability')
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

    const today = getCurrentDateGMT3()
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
        payment_status,
        amount_paid,
        amount_pending,
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
      .gte("delivery_date", getDateStringGMT3(today))
      .lte("delivery_date", getDateStringGMT3(futureDate))
      .in("status", ["PENDING", "CONFIRMED", "IN_PRODUCTION"])
      .order("delivery_date")
      .limit(20) // Limitar a 20 pedidos para mejorar rendimiento

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching upcoming orders", error, 'orderActions.getUpcomingOrders')
    // En caso de error, usar datos de ejemplo
    return {
      success: true,
      data: getMockUpcomingOrders()
    }
  }
}

// Register payment for an order
export async function registerOrderPayment(orderId: string, amount: number) {
  try {
    const { data, error } = await supabase
      .rpc('register_payment', {
        table_name_param: 'orders',
        record_id_param: orderId,
        payment_amount_param: amount
      })

    if (error) throw error

    const result = data as { success: boolean; message: string; data?: any }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    revalidatePath("/pedidos")
    revalidatePath("/reportes")
    return { success: true, message: result.message, data: result.data }
  } catch (error: any) {
    logger.error("Error registering order payment", error, 'orderActions.registerOrderPayment')
    return { success: false, message: error.message || "Error al registrar pago" }
  }
}

// Get orders with pending payments
export async function getOrdersWithPendingPayment() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(id, name)
      `)
      .in('payment_status', ['pendiente', 'parcial'])
      .neq('status', 'CANCELLED')
      .order('delivery_date')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    logger.error("Error fetching orders with pending payment", error, 'orderActions.getOrdersWithPendingPayment')
    return { success: false, message: error.message || "Error al obtener pedidos pendientes" }
  }
}

// Complete order and create sale automatically
export async function completeOrderWithSale(orderId: string, paymentStatus: 'pagado' | 'pendiente') {
  try {
    logger.debug('Completing order and creating sale', { orderId, paymentStatus }, 'orderActions.completeOrderWithSale')

    const { data, error } = await supabase
      .rpc("complete_order_and_create_sale", {
        order_id_param: orderId,
        payment_status_param: paymentStatus
      })

    if (error) throw error

    const result = data as {
      success: boolean;
      message: string;
      sale_id?: string;
      total_amount?: number;
    }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    // Revalidate relevant paths
    revalidatePath("/pedidos")
    revalidatePath("/ventas")
    revalidatePath("/reportes")
    clearRelevantCache('order')

    logger.info('Order completed and sale created', { 
      orderId, 
      saleId: result.sale_id,
      totalAmount: result.total_amount 
    }, 'orderActions.completeOrderWithSale')

    return {
      success: true,
      message: result.message,
      saleId: result.sale_id,
      totalAmount: result.total_amount
    }
  } catch (error: any) {
    logger.error("Error completing order and creating sale", error, 'orderActions.completeOrderWithSale')
    return { success: false, message: error.message || "Error al completar pedido" }
  }
}

// Move order to production
export async function moveOrderToProduction(orderId: string) {
  try {
    logger.info('Moving order to production', { orderId })
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'IN_PRODUCTION' })
      .eq('id', orderId)
      .eq('status', 'CONFIRMED') // Solo permitir si está confirmado
      .select()

    if (error) {
      logger.error('Error moving order to production', { error: error.message })
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      throw new Error('Pedido no encontrado o no se puede pasar a producción')
    }

    // Limpiar caché relevante
    await clearRelevantCache('order')
    
    // Revalidar páginas
    revalidatePath('/pedidos')
    
    logger.info('Order moved to production successfully', { orderId })

    return {
      success: true,
      message: 'Pedido pasado a producción exitosamente'
    }
  } catch (error: any) {
    logger.error('Error in moveOrderToProduction', { error: error.message })
    throw new Error(error.message || 'Error al pasar el pedido a producción')
  }
}