"use server"

import { supabase } from "@/lib/supabase"
import { paymentRegistrationSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { AccountsReceivable, PaymentStatus } from "@/lib/types"

// Register payment for orders or sales
export async function registerPayment(
  type: 'orders' | 'sales',
  recordId: string,
  amount: number
) {
  try {
    const validated = paymentRegistrationSchema.parse({ amount })

    logger.debug('Registering payment', { type, recordId, amount }, 'paymentActions.registerPayment')

    // Call the RPC function to register payment atomically
    const { data, error } = await supabase
      .rpc('register_payment', {
        table_name_param: type,
        record_id_param: recordId,
        payment_amount_param: validated.amount
      })

    if (error) throw error

    const result = data as { success: boolean; message: string; data?: any }

    if (!result.success) {
      return { success: false, message: result.message }
    }

    // Revalidate relevant paths
    revalidatePath("/pedidos")
    revalidatePath("/ventas")
    revalidatePath("/reportes")
    
    logger.info('Payment registered successfully', { type, recordId, amount }, 'paymentActions.registerPayment')

    return {
      success: true,
      message: result.message,
      data: result.data
    }
  } catch (error: any) {
    logger.error("Error registering payment", error, 'paymentActions.registerPayment')
    return { success: false, message: error.message || "Error al registrar pago" }
  }
}

// Get accounts receivable (all pending and partial payments)
export async function getAccountsReceivable() {
  try {
    logger.debug('Fetching accounts receivable', {}, 'paymentActions.getAccountsReceivable')

    const { data, error } = await supabase
      .rpc('get_accounts_receivable')

    if (error) throw error

    const accounts = data as AccountsReceivable[]

    // Calculate totals
    const totals = accounts.reduce((acc, account) => {
      acc.totalAmount += account.total_amount
      acc.totalPaid += account.amount_paid
      acc.totalPending += account.amount_pending
      
      if (account.payment_status === 'pendiente') {
        acc.pendingCount += 1
      } else if (account.payment_status === 'parcial') {
        acc.partialCount += 1
      }
      
      return acc
    }, {
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      pendingCount: 0,
      partialCount: 0
    })

    logger.info(`Fetched ${accounts.length} accounts receivable`, totals, 'paymentActions.getAccountsReceivable')

    return {
      success: true,
      data: {
        accounts,
        totals
      }
    }
  } catch (error: any) {
    logger.error("Error fetching accounts receivable", error, 'paymentActions.getAccountsReceivable')
    return { success: false, message: error.message || "Error al obtener cuentas por cobrar" }
  }
}

// Get orders with pending payments
export async function getOrdersWithPendingPayment() {
  try {
    logger.debug('Fetching orders with pending payment', {}, 'paymentActions.getOrdersWithPendingPayment')

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

    logger.info(`Fetched ${data?.length || 0} orders with pending payments`, {}, 'paymentActions.getOrdersWithPendingPayment')

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    logger.error("Error fetching orders with pending payment", error, 'paymentActions.getOrdersWithPendingPayment')
    return { success: false, message: error.message || "Error al obtener pedidos pendientes" }
  }
}

// Get sales with pending payments
export async function getSalesWithPendingPayment() {
  try {
    logger.debug('Fetching sales with pending payment', {}, 'paymentActions.getSalesWithPendingPayment')

    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(id, name)
      `)
      .in('payment_status', ['pendiente', 'parcial'])
      .order('sale_date')

    if (error) throw error

    logger.info(`Fetched ${data?.length || 0} sales with pending payments`, {}, 'paymentActions.getSalesWithPendingPayment')

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    logger.error("Error fetching sales with pending payment", error, 'paymentActions.getSalesWithPendingPayment')
    return { success: false, message: error.message || "Error al obtener ventas pendientes" }
  }
}

// Get payment status summary for dashboard
export async function getPaymentStatusSummary() {
  try {
    logger.debug('Fetching payment status summary', {}, 'paymentActions.getPaymentStatusSummary')

    // Get orders summary
    const { data: ordersSummary, error: ordersError } = await supabase
      .from("orders")
      .select('payment_status, amount_pending')
      .neq('status', 'CANCELLED')

    if (ordersError) throw ordersError

    // Get sales summary
    const { data: salesSummary, error: salesError } = await supabase
      .from("sales")
      .select('payment_status, amount_pending')

    if (salesError) throw salesError

    // Calculate totals
    const allAccounts = [...(ordersSummary || []), ...(salesSummary || [])]
    
    const summary = allAccounts.reduce((acc, account) => {
      if (account.payment_status === 'pendiente') {
        acc.pendingAmount += account.amount_pending
        acc.pendingCount += 1
      } else if (account.payment_status === 'parcial') {
        acc.partialAmount += account.amount_pending
        acc.partialCount += 1
      }
      return acc
    }, {
      pendingAmount: 0,
      pendingCount: 0,
      partialAmount: 0,
      partialCount: 0
    })

    logger.info('Payment status summary calculated', summary, 'paymentActions.getPaymentStatusSummary')

    return {
      success: true,
      data: summary
    }
  } catch (error: any) {
    logger.error("Error fetching payment status summary", error, 'paymentActions.getPaymentStatusSummary')
    return { success: false, message: error.message || "Error al obtener resumen de pagos" }
  }
}


