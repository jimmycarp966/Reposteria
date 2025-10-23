import { z } from "zod"

// Ingredient validations
export const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  cost_per_unit: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  supplier: z.string().optional(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  image_url: z.string().url().optional().or(z.literal("")),
})

// Recipe validations
export const recipeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  servings: z.number().int().min(1, "Las porciones deben ser mayor a 0"),
  image_url: z.string().url().optional().or(z.literal("")),
})

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().uuid("ID de ingrediente inválido"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  unit: z.string().min(1, "La unidad es requerida"),
})

export const createRecipeSchema = recipeSchema.extend({
  ingredients: z.array(recipeIngredientSchema).min(1, "Debe tener al menos un ingrediente"),
})

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  recipe_id: z.string().uuid().optional(),
  sku: z.string().optional(),
  base_cost_cache: z.number().min(0, "El costo base debe ser mayor o igual a 0"),
  suggested_price_cache: z.number().min(0, "El precio sugerido debe ser mayor o igual a 0"),
  image_url: z.string().url().optional().or(z.literal("")),
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
    const deliveryDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return deliveryDate >= today
  }, "La fecha de entrega debe ser hoy o posterior"),
  delivery_time: z.string().optional(),
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
  week_start_date: z.string().refine((date) => {
    const d = new Date(date)
    return !isNaN(d.getTime()) && d.getDay() === 1 // Monday
  }, "La fecha debe ser un lunes"),
  notes: z.string().optional(),
})

export const weeklyProductionTaskSchema = z.object({
  plan_id: z.string().uuid("ID de plan inválido"),
  day_of_week: z.number().int().min(1).max(7, "El día debe estar entre 1 (Lunes) y 7 (Domingo)"),
  task_description: z.string().min(1, "La descripción de la tarea es requerida"),
  recipe_id: z.string().uuid("ID de receta inválido").optional(),
  estimated_time_minutes: z.number().int().min(0).optional(),
  order_position: z.number().int().min(0).default(0),
})

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pendiente', 'en_progreso', 'completada'], {
    required_error: "El estado de la tarea es requerido",
  }),
})



