import { z } from "zod"
import { parseDateGMT3, getTodayGMT3 } from "./utils"

// Ingredient validations
export const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  cost_per_unit: z.number().min(0, "El costo debe ser mayor o igual a 0").default(0),
  supplier: z.string().optional(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  image_url: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().url().optional()
  ),
})

// Recipe validations
export const recipeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  servings: z.number().int().min(1, "Las porciones deben ser mayor a 0"),
  image_url: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().url().optional()
  ),
})

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().uuid("ID de ingrediente inválido"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  unit: z.string().min(1, "La unidad es requerida"),
})

export const createRecipeSchema = recipeSchema.extend({
  ingredients: z.array(recipeIngredientSchema).min(1, "Debe tener al menos un ingrediente"),
})

export const editRecipeSchema = recipeSchema.extend({
  ingredients: z.array(recipeIngredientSchema.extend({
    id: z.string().uuid("ID inválido").optional(),
  })).min(1, "Debe tener al menos un ingrediente"),
})

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  recipe_id: z.string().uuid().optional(),
  sku: z.string().optional(),
  base_cost_cache: z.number().min(0, "El costo base debe ser mayor o igual a 0"),
  suggested_price_cache: z.number().min(0, "El precio sugerido debe ser mayor o igual a 0"),
  image_url: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().url().optional()
  ),
})

// Order validations
export const orderItemSchema = z.object({
  product_id: z.string().uuid("ID de producto inválido"),
  quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0, "El precio unitario debe ser mayor o igual a 0"),
  cost_at_sale: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  production_time_estimate_minutes: z.number().int().min(0, "El tiempo de producción debe ser mayor o igual a 0"),
})

export const orderSchema = z.object({
  type: z.enum(["DAILY", "EFEMERIDE"], {
    required_error: "El tipo de pedido es requerido",
  }),
  delivery_date: z.string().refine((date) => {
    // Parsear la fecha de entrega en GMT-3
    const deliveryDate = parseDateGMT3(date)
    deliveryDate.setHours(0, 0, 0, 0)
    
    // Obtener fecha de hoy en GMT-3 y normalizar a medianoche
    const todayStr = getTodayGMT3()
    const today = parseDateGMT3(todayStr)
    today.setHours(0, 0, 0, 0)
    
    // Comparar solo las fechas (sin hora)
    return deliveryDate >= today
  }, "La fecha de entrega debe ser hoy o posterior"),
  delivery_time: z.string().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Debe tener al menos un producto"),
})

// Inventory validations
export const inventoryUpdateSchema = z.object({
  ingredient_id: z.string().uuid("ID de ingrediente inválido"),
  quantity: z.number().min(0, "La cantidad debe ser mayor o igual a 0"),
  type: z.enum(["IN", "OUT"]),
  notes: z.string().optional(),
})

// Event Calendar validations
export const eventSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  date: z.string().refine((date) => {
    return !isNaN(Date.parse(date))
  }, "Fecha inválida"),
  description: z.string().optional(),
  type: z.enum(["EFEMERIDE", "REMINDER"]),
})

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser un código hexadecimal válido (ej: #FF5733)"),
})

// Price Rule validations
export const priceRuleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  markup_percent: z.number().min(0, "El margen debe ser mayor o igual a 0"),
  fixed_fee: z.number().min(0, "La tarifa fija debe ser mayor o igual a 0"),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
  event_id: z.string().uuid().optional(),
})

// Settings validations
export const settingSchema = z.object({
  key: z.string().min(1, "La clave es requerida"),
  value: z.string().min(1, "El valor es requerido"),
})

// Customer validations
export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})

// Sale validations
export const saleItemSchema = z.object({
  product_id: z.string().uuid("ID de producto inválido"),
  quantity: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0, "El precio unitario debe ser mayor o igual a 0"),
})

export const saleSchema = z.object({
  sale_date: z.string().refine((date) => {
    return !isNaN(Date.parse(date))
  }, "Fecha inválida"),
  customer_id: z.string().uuid().optional(),
  payment_method: z.enum(["efectivo", "tarjeta", "transferencia"], {
    required_error: "El método de pago es requerido",
  }),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe tener al menos un producto"),
})

// Event Product validations
export const eventProductSchema = z.object({
  event_id: z.string().uuid("ID de evento inválido"),
  product_id: z.string().uuid("ID de producto inválido"),
  special_price: z.number().min(0, "El precio especial debe ser mayor o igual a 0").optional(),
})

// Payment validations
export const paymentStatusSchema = z.enum(['pendiente', 'parcial', 'pagado'], {
  required_error: "El estado de pago es requerido",
})

export const paymentRegistrationSchema = z.object({
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  notes: z.string().optional(),
})

// Weekly Production Plan validations
export const weeklyProductionPlanSchema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  notes: z.string().optional(),
})

export const weeklyProductionTaskSchema = z.object({
  plan_id: z.string().uuid(),
  day_of_week: z.number().min(1).max(7),
  task_description: z.string().min(1, "La descripción es requerida"),
  recipe_id: z.string().uuid().optional().nullable(),
  estimated_time_minutes: z.number().int().positive().optional().nullable(),
  order_position: z.number().int().min(0),
  category_id: z.string().uuid().optional().nullable(),
})

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pendiente', 'en_progreso', 'completada'], {
    required_error: "El estado de la tarea es requerido",
  }),
})

// Ingredient Purchase validations
export const ingredientPurchaseSchema = z.object({
  ingredient_id: z.string().uuid("ID de ingrediente inválido"),
  purchase_date: z.string().refine((date) => {
    return !isNaN(Date.parse(date))
  }, "Fecha inválida"),
  quantity_purchased: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  unit_purchased: z.string().min(1, "La unidad es requerida"),
  total_price: z.number().min(0, "El precio total debe ser mayor o igual a 0"),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  // Nuevo flag para indicar si esta operación debe impactar el stock
  affects_stock: z.boolean().optional().default(true),
})



