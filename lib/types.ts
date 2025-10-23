/**
 * Tipos TypeScript centralizados para el sistema de repostería
 * Derivados de las tablas de Supabase con tipos compuestos para relaciones
 */

import { 
  Ingredient, 
  Recipe, 
  RecipeIngredient, 
  Product, 
  Inventory, 
  InventoryMovement,
  Order,
  OrderItem,
  ProductionTask,
  EventCalendar,
  PriceRule,
  Setting
} from './supabase'

// ==================== Nuevos Tipos para Ventas y Efemérides ====================

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  created_at: string
}

// ==================== Tipos de Pago ====================

export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado'

export interface AccountsReceivable {
  id: string
  type: 'pedido' | 'venta'
  customer_name: string
  total_amount: number
  amount_paid: number
  amount_pending: number
  payment_status: PaymentStatus
  created_date: string
  due_date: string
}

// ==================== Tipos de Plan Semanal ====================

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada'

export interface WeeklyProductionPlan {
  id: string
  week_start_date: string
  week_end_date: string
  notes?: string | null
  created_at: string
}

export interface WeeklyProductionTask {
  id: string
  plan_id: string
  day_of_week: number // 1=Lunes, 7=Domingo
  task_description: string
  recipe_id?: string | null
  estimated_time_minutes?: number | null
  status: TaskStatus
  completed_at?: string | null
  order_position: number
  created_at: string
}

export interface WeeklyProductionTaskWithRecipe extends WeeklyProductionTask {
  recipe?: Pick<Recipe, 'id' | 'name' | 'image_url'> | null
}

export interface WeeklyPlanWithTasks extends WeeklyProductionPlan {
  tasks: WeeklyProductionTaskWithRecipe[]
}

export interface WeeklyPlanStats {
  total_tasks: number
  completed_tasks: number
  completion_percentage: number
  total_time_minutes: number
  completed_time_minutes: number
  time_completion_percentage: number
  tasks_by_day: {
    day_of_week: number
    total_tasks: number
    completed_tasks: number
    total_time_minutes: number
    completed_time_minutes: number
  }[]
}

export interface Sale {
  id: string
  sale_date: string
  customer_id?: string | null
  total_amount: number
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia'
  payment_status: PaymentStatus
  amount_paid: number
  amount_pending: number
  notes?: string | null
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

export interface EventProduct {
  id: string
  event_id: string
  product_id: string
  special_price?: number | null
  created_at: string
}

// ==================== Tipos Compuestos para Relaciones ====================

export type IngredientWithInventory = Ingredient & {
  inventory?: Pick<Inventory, 'quantity' | 'unit' | 'location'> | null
}

export type RecipeIngredientWithDetails = RecipeIngredient & {
  ingredient: Pick<Ingredient, 'id' | 'name' | 'cost_per_unit' | 'unit'>
}

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredientWithDetails[]
}

export type ProductWithRecipe = Product & {
  recipe?: Pick<Recipe, 'id' | 'name' | 'servings'> | null
}

export type OrderItemWithProduct = OrderItem & {
  product: Pick<Product, 'id' | 'name' | 'image_url'>
}

export type OrderWithItems = Order & {
  order_items: OrderItemWithProduct[]
}

export type ProductionTaskWithDetails = ProductionTask & {
  order_item: OrderItem & {
    order: Pick<Order, 'id' | 'delivery_date' | 'delivery_time' | 'status'>
    product: Pick<Product, 'id' | 'name'>
  }
}

export type InventoryWithIngredient = Inventory & {
  ingredient: Pick<Ingredient, 'id' | 'name' | 'unit'>
}

export type InventoryMovementWithIngredient = InventoryMovement & {
  ingredient: Pick<Ingredient, 'id' | 'name'>
}

export type SaleItemWithProduct = SaleItem & {
  product: Pick<Product, 'id' | 'name' | 'image_url' | 'sku'>
}

export type SaleWithItems = Sale & {
  sale_items: SaleItemWithProduct[]
  customer?: Pick<Customer, 'id' | 'name'> | null
}

export type EventProductWithDetails = EventProduct & {
  product: Pick<Product, 'id' | 'name' | 'image_url' | 'suggested_price_cache' | 'sku'>
}

export type EventWithProducts = EventCalendar & {
  event_products: EventProductWithDetails[]
}

export type CustomerWithSales = Customer & {
  sales_count?: number
  total_spent?: number
}

// ==================== Tipos para Server Actions ====================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  search?: string
}

export interface OrdersQueryParams extends PaginationParams, SortParams {
  status?: Order['status']
}

export interface ProductsQueryParams extends PaginationParams, SearchParams {}

export interface IngredientsQueryParams extends PaginationParams, SearchParams {
  lowStockOnly?: boolean
}

export interface RecipesQueryParams extends PaginationParams, SearchParams {
  activeOnly?: boolean
}

export interface SalesQueryParams extends PaginationParams, SortParams {
  dateFrom?: string
  dateTo?: string
  customerId?: string
  paymentMethod?: Sale['payment_method']
}

export interface CustomersQueryParams extends PaginationParams, SearchParams {}

export interface PaginatedResponse<T> {
  success: boolean
  data?: T[]
  message?: string
  needsSetup?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  shortages?: StockShortage[]
}

export interface StockShortage {
  ingredient_id: string
  ingredient_name: string
  required_quantity: number
  available_quantity: number
  shortage: number
}

export interface EventSalesStats {
  event_date: string
  total_sales: number
  total_items_sold: number
  total_customers: number
  average_ticket: number
}

export interface DailySalesStats {
  date: string
  total_sales: number
  total_items_sold: number
  total_customers: number
  total_sales_count: number
  average_ticket: number
}

// ==================== Tipos para Componentes UI ====================

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
  mobileCardRender?: (row: T) => React.ReactNode
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
}

export interface SearchFilterConfig {
  label: string
  key: string
  options: { value: string; label: string }[]
}

// ==================== Tipos para Validaciones ====================

export interface RecipeCostCalculation {
  totalCost: number
  costPerServing: number
  ingredients: {
    name: string
    quantity: number
    unit: string
    cost: number
  }[]
}

export interface ProductPriceCalculation {
  baseCost: number
  markupPercent: number
  suggestedPrice: number
  profitMargin: number
}

// ==================== Tipos para i18n ====================

export type LocaleKey = 'es' | 'en'

export interface TranslationMessages {
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    create: string
    search: string
    filter: string
    actions: string
    loading: string
    error: string
    success: string
    confirm: string
    back: string
    next: string
  }
  orders: {
    title: string
    create: string
    confirm: string
    cancel: string
    pending: string
    confirmed: string
    inProduction: string
    completed: string
    cancelled: string
  }
  products: {
    title: string
    create: string
    baseCost: string
    suggestedPrice: string
    recipe: string
  }
  ingredients: {
    title: string
    create: string
    stock: string
    unit: string
    cost: string
    lowStock: string
  }
  recipes: {
    title: string
    create: string
    servings: string
    cost: string
    duplicate: string
  }
}

// Re-exportar tipos base para conveniencia
export type {
  Ingredient,
  Recipe,
  RecipeIngredient,
  Product,
  Inventory,
  InventoryMovement,
  Order,
  OrderItem,
  ProductionTask,
  EventCalendar,
  PriceRule,
  Setting
}

