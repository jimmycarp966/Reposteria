// Tipos para pedidos
export type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED"
export type OrderType = "DAILY" | "EFEMERIDE"
export type PaymentStatus = "pendiente" | "parcial" | "pagado"

export interface Order {
  id: string
  type: OrderType
  status: OrderStatus
  delivery_date: string
  delivery_time?: string
  total_cost: number
  total_price: number
  payment_status: PaymentStatus
  amount_paid: number
  amount_pending: number
  production_start: string
  production_end?: string
  notes?: string
  has_stock_shortage?: boolean
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  cost_at_sale: number
  production_time_estimate_minutes: number
  product?: Product
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product: Product
  })[]
}

// Tipos para productos
export interface Product {
  id: string
  name: string
  recipe_id?: string
  base_cost_cache: number
  suggested_price_cache: number
  sku?: string
  image_url?: string
  created_at: string
}

export interface ProductWithRecipe extends Product {
  recipe?: Pick<Recipe, 'id' | 'name' | 'servings'>
}

// Tipos para recetas
export interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  version: number
  active: boolean
  image_url?: string
  created_at: string
  recipe_ingredients?: RecipeIngredient[]
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredient[]
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  unit: string
  ingredient: Ingredient
}

// Tipos para ingredientes
export interface Ingredient {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  supplier?: string
  lead_time_days?: number
  image_url?: string
  created_at: string
}

export interface IngredientWithInventory extends Ingredient {
  inventory: InventoryItem
}

// Tipos para inventario
export interface InventoryItem {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  location?: string
  last_updated: string
  ingredient: Ingredient
}

export interface InventoryMovement {
  id: string
  ingredient_id: string
  quantity: number
  type: "IN" | "OUT"
  order_id?: string
  notes?: string
  created_at: string
}

// Tipos para faltantes de stock
export interface StockShortage {
  ingredient_id: string
  ingredient_name: string
  required_quantity: number
  available_quantity: number
  shortage: number
}

// Tipos para parámetros de consulta
export interface OrdersQueryParams {
  status?: OrderStatus
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductsQueryParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface CustomersQueryParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface IngredientsQueryParams {
  page?: number
  pageSize?: number
  search?: string
  lowStockOnly?: boolean
}

export interface RecipesQueryParams {
  page?: number
  pageSize?: number
  search?: string
  activeOnly?: boolean
}

export interface SalesQueryParams {
  dateFrom?: string
  dateTo?: string
  customerId?: string
  paymentMethod?: string
}

// Tipos para respuestas paginadas
export interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data?: T[]
  needsSetup?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Tipos para eventos y efemérides
export interface Event {
  id: string
  name: string
  date: string
  description?: string
  type: "EFEMERIDE" | "REMINDER"
}

export interface EventProduct {
  id: string
  event_id: string
  product_id: string
  special_price?: number
  created_at: string
}

export interface EventProductWithDetails extends EventProduct {
  product: Product
}

export interface EventWithProducts extends Event {
  event_products: EventProductWithDetails[]
}

export interface EventSalesStats {
  event_date: string
  total_sales: number
  total_items_sold: number
  total_customers: number
  average_ticket: number
}

// Tipos para plan semanal
export interface WeeklyPlan {
  id: string
  week_start_date: string
  week_end_date: string
  notes?: string
  created_at: string
}

export interface WeeklyTask {
  id: string
  plan_id: string
  day_of_week: number
  task_description: string
  recipe_id?: string
  estimated_time_minutes?: number
  status: "pendiente" | "en_progreso" | "completada"
  completed_at?: string
  order_position: number
  created_at: string
}

export interface WeeklyPlanWithTasks extends WeeklyPlan {
  tasks: WeeklyTask[]
}

export interface WeeklyProductionTask {
  id: string
  plan_id: string
  day_of_week: number
  task_description: string
  recipe_id?: string
  estimated_time_minutes?: number
  status: "pendiente" | "en_progreso" | "completada"
  completed_at?: string
  order_position: number
  created_at: string
}

export interface WeeklyProductionTaskWithRecipe extends WeeklyProductionTask {
  recipe?: Recipe
  category?: TaskCategory
  category_id?: string
}

export interface WeeklyPlanStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completion_percentage: number
}

export interface TaskCategory {
  id: string
  name: string
  description?: string
  color?: string
  created_at: string
}

export interface Column<T = any> {
  key: string
  header: string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

// Tipos para clientes
export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
}

export interface CustomerWithSales extends Customer {
  sales_count: number
  total_spent: number
}

// Tipos para ventas
export interface Sale {
  id: string
  sale_date: string
  customer_id?: string
  total_amount: number
  payment_method: "efectivo" | "tarjeta" | "transferencia"
  payment_status: PaymentStatus
  amount_paid: number
  amount_pending: number
  notes?: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface SaleWithItems extends Sale {
  customer?: Customer
  sale_items: (SaleItem & {
    product: Product
  })[]
}

export interface DailySalesStats {
  date: string
  total_sales: number
  total_items_sold: number
  total_customers: number
  total_sales_count: number
  average_ticket: number
}

export interface AccountsReceivable {
  id: string
  type: 'order' | 'sale'
  total_amount: number
  amount_paid: number
  amount_pending: number
  payment_status: PaymentStatus
  created_at: string
  customer_name?: string
  due_date?: string
}

// Tipos para configuración
export interface Setting {
  id: string
  key: string
  value: string
}