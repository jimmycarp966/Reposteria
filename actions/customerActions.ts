"use server"

import { supabase } from "@/lib/supabase"
import { customerSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { CustomersQueryParams, CustomerWithSales } from "@/lib/types"

// Get all customers
export async function getCustomers(params: CustomersQueryParams = {}) {
  try {
    let query = supabase
      .from("customers")
      .select("*")
      .order("name")

    // Apply search filter
    if (params.search) {
      query = query.ilike("name", `%${params.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching customers", error, 'customerActions.getCustomers')
    return { success: false, message: error.message || "Error al obtener clientes" }
  }
}

// Get customer by ID
export async function getCustomerById(id: string) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error fetching customer", error, 'customerActions.getCustomerById')
    return { success: false, message: error.message || "Error al obtener cliente" }
  }
}

// Create customer
export async function createCustomer(formData: any) {
  try {
    const validated = customerSchema.parse(formData)

    const { data, error } = await supabase
      .from("customers")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ventas")
    return { success: true, data, message: "Cliente creado exitosamente" }
  } catch (error: any) {
    logger.error("Error creating customer", error, 'customerActions.createCustomer')
    return { success: false, message: error.message || "Error al crear cliente" }
  }
}

// Update customer
export async function updateCustomer(id: string, formData: any) {
  try {
    const validated = customerSchema.parse(formData)

    const { data, error } = await supabase
      .from("customers")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/ventas")
    return { success: true, data, message: "Cliente actualizado exitosamente" }
  } catch (error: any) {
    logger.error("Error updating customer", error, 'customerActions.updateCustomer')
    return { success: false, message: error.message || "Error al actualizar cliente" }
  }
}

// Delete customer
export async function deleteCustomer(id: string) {
  try {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/ventas")
    return { success: true, message: "Cliente eliminado exitosamente" }
  } catch (error: any) {
    logger.error("Error deleting customer", error, 'customerActions.deleteCustomer')
    return { success: false, message: error.message || "Error al eliminar cliente" }
  }
}

// Search customers
export async function searchCustomers(query: string) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10)

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    logger.error("Error searching customers", error, 'customerActions.searchCustomers')
    return { success: false, message: error.message || "Error al buscar clientes" }
  }
}

// Get customer with sales statistics
export async function getCustomerWithSales(id: string) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        sales(count)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get total spent
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("total_amount")
      .eq("customer_id", id)

    if (salesError) throw salesError

    const totalSpent = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0
    const salesCount = salesData?.length || 0

    const customerWithSales = {
      ...data,
      sales_count: salesCount,
      total_spent: totalSpent
    }

    return { success: true, data: customerWithSales as CustomerWithSales }
  } catch (error: any) {
    logger.error("Error fetching customer with sales", error, 'customerActions.getCustomerWithSales')
    return { success: false, message: error.message || "Error al obtener cliente" }
  }
}






