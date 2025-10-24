import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Solo crear el cliente si las variables están definidas (runtime)
// Durante el build, usar valores dummy
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

// Función para crear cliente de Supabase (para server actions)
export function createSupabaseClient() {
  return createClient(url, key)
}

// Types para las tablas
export type Ingredient = {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  supplier?: string
  lead_time_days?: number
  image_url?: string
  created_at?: string
}

export type Recipe = {
  id: string
  name: string
  description?: string
  servings: number
  version: number
  active: boolean
  image_url?: string
  created_at?: string
}

export type RecipeIngredient = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  unit: string
}

export type Product = {
  id: string
  recipe_id?: string
  name: string
  base_cost_cache: number
  suggested_price_cache: number
  sku?: string
  image_url?: string
  created_at?: string
}

export type Inventory = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  location?: string
  last_updated?: string
}

export type InventoryMovement = {
  id: string
  ingredient_id: string
  quantity: number
  type: 'IN' | 'OUT'
  order_id?: string
  notes?: string
  created_at?: string
}

export type Order = {
  id: string
  type: 'DAILY' | 'EFEMERIDE'
  status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED'
  delivery_date: string
  delivery_time?: string
  total_cost: number
  total_price: number
  payment_status: 'pendiente' | 'parcial' | 'pagado'
  amount_paid: number
  amount_pending: number
  production_start?: string
  production_end?: string
  notes?: string
  created_at?: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  cost_at_sale: number
  production_time_estimate_minutes: number
}

export type ProductionTask = {
  id: string
  order_item_id: string
  task_name: string
  duration_minutes: number
  start_time?: string
  end_time?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export type EventCalendar = {
  id: string
  name: string
  date: string
  description?: string
  type: 'EFEMERIDE' | 'REMINDER'
}

export type PriceRule = {
  id: string
  name: string
  markup_percent: number
  fixed_fee: number
  effective_from?: string
  effective_to?: string
  event_id?: string
}

export type Setting = {
  id: string
  key: string
  value: string
}



