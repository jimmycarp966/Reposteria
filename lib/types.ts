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

