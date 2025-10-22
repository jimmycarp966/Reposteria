# 📐 Architecture.md - Sistema de Repostería

## 🎯 Visión General

Sistema web de gestión para emprendimientos de repostería que automatiza el cálculo de costos, gestión de inventario, pedidos y producción. Diseñado para un solo usuario sin necesidad de autenticación compleja.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  Next.js 15 (App Router) + React 19 + TypeScript        │
│  Tailwind CSS + shadcn/ui + Zustand                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Server Actions
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND / API                         │
│         Next.js Server Actions (Server-Side)            │
│         Validación con Zod                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ supabase-js
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  BASE DE DATOS                           │
│          Supabase (PostgreSQL + Storage)                │
│          RLS Policies + RPC Functions                   │
└─────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Datos

### Diagrama de Relaciones

```
ingredients (ingredientes)
    ↓ 1:1
inventory (inventario actual)
    ↓ 1:N
inventory_movements (historial de movimientos)

ingredients 
    ↓ N:M (via recipe_ingredients)
recipes (recetas)
    ↓ 1:N
products (productos)
    ↓ N:M (via order_items)
orders (pedidos)
    ↓ 1:N
order_items
    ↓ 1:N
production_tasks (tareas de producción)

events_calendar (efemérides)
    ↓ 1:N
price_rules (reglas de precio especiales)
    ↓ aplican a
orders (de tipo EFEMERIDE)

settings (configuración global)
```

### Tablas Principales

#### 1. `ingredients` (Ingredientes)
Almacena los ingredientes base para las recetas.

```sql
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- unit: VARCHAR(50) NOT NULL (ej: kg, litro, unidad)
- cost_per_unit: DECIMAL(10,2) NOT NULL ≥ 0
- supplier: VARCHAR(255)
- lead_time_days: INTEGER ≥ 0
- image_url: TEXT
- created_at: TIMESTAMP
```

#### 2. `recipes` (Recetas)
Las recetas definen cómo se combinan los ingredientes.

```sql
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- description: TEXT
- servings: INTEGER NOT NULL > 0 (porciones)
- version: INTEGER DEFAULT 1
- active: BOOLEAN DEFAULT TRUE (soft delete)
- image_url: TEXT
- created_at: TIMESTAMP
```

#### 3. `recipe_ingredients` (Ingredientes de Receta)
Tabla de unión many-to-many entre recetas e ingredientes.

```sql
- id: UUID (PK)
- recipe_id: UUID (FK → recipes) NOT NULL
- ingredient_id: UUID (FK → ingredients) NOT NULL
- quantity: DECIMAL(10,3) NOT NULL > 0
- unit: VARCHAR(50) NOT NULL
- UNIQUE(recipe_id, ingredient_id)
```

#### 4. `products` (Productos)
Productos que se venden, basados en recetas.

```sql
- id: UUID (PK)
- recipe_id: UUID (FK → recipes) nullable
- name: VARCHAR(255) NOT NULL
- base_cost_cache: DECIMAL(10,2) NOT NULL ≥ 0 (costo base cacheado)
- suggested_price_cache: DECIMAL(10,2) NOT NULL ≥ 0 (precio sugerido)
- sku: VARCHAR(100) UNIQUE
- image_url: TEXT
- created_at: TIMESTAMP
```

**Nota**: Los costos están "cacheados" para rendimiento. Cuando cambia el costo de un ingrediente, se debe recalcular manualmente.

#### 5. `inventory` (Inventario Actual)
Stock actual de cada ingrediente (1:1 con ingredients).

```sql
- id: UUID (PK)
- ingredient_id: UUID (FK → ingredients) NOT NULL UNIQUE
- quantity: DECIMAL(10,3) NOT NULL ≥ 0
- unit: VARCHAR(50) NOT NULL
- location: VARCHAR(255) (ej: Despensa, Heladera)
- last_updated: TIMESTAMP
```

#### 6. `inventory_movements` (Movimientos de Inventario)
Historial de entradas y salidas de stock.

```sql
- id: UUID (PK)
- ingredient_id: UUID (FK → ingredients) NOT NULL
- quantity: DECIMAL(10,3) NOT NULL
- type: VARCHAR(10) NOT NULL ∈ {IN, OUT}
- order_id: UUID (FK → orders) nullable
- notes: TEXT
- created_at: TIMESTAMP
```

#### 7. `orders` (Pedidos)
Pedidos de clientes con fechas de entrega.

```sql
- id: UUID (PK)
- type: VARCHAR(20) NOT NULL ∈ {DAILY, EFEMERIDE}
- status: VARCHAR(20) NOT NULL ∈ {PENDING, CONFIRMED, IN_PRODUCTION, COMPLETED, CANCELLED}
- delivery_date: DATE NOT NULL
- delivery_time: TIME
- total_cost: DECIMAL(10,2) NOT NULL ≥ 0
- total_price: DECIMAL(10,2) NOT NULL ≥ 0
- production_start: TIMESTAMP (calculado automáticamente)
- production_end: TIMESTAMP
- notes: TEXT
- created_at: TIMESTAMP
```

#### 8. `order_items` (Items del Pedido)
Productos incluidos en cada pedido.

```sql
- id: UUID (PK)
- order_id: UUID (FK → orders) NOT NULL
- product_id: UUID (FK → products) NOT NULL
- quantity: INTEGER NOT NULL > 0
- unit_price: DECIMAL(10,2) NOT NULL ≥ 0
- cost_at_sale: DECIMAL(10,2) NOT NULL ≥ 0 (costo al momento de venta)
- production_time_estimate_minutes: INTEGER NOT NULL ≥ 0
```

#### 9. `production_tasks` (Tareas de Producción)
Tareas individuales para completar un pedido.

```sql
- id: UUID (PK)
- order_item_id: UUID (FK → order_items) NOT NULL
- task_name: VARCHAR(255) NOT NULL
- duration_minutes: INTEGER NOT NULL ≥ 0
- start_time: TIMESTAMP
- end_time: TIMESTAMP
- status: VARCHAR(20) NOT NULL ∈ {PENDING, IN_PROGRESS, COMPLETED}
```

#### 10. `events_calendar` (Efemérides y Eventos)
Fechas especiales para promociones.

```sql
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- date: DATE NOT NULL
- description: TEXT
- type: VARCHAR(20) NOT NULL ∈ {EFEMERIDE, REMINDER}
```

#### 11. `price_rules` (Reglas de Precio)
Precios especiales para efemérides.

```sql
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- markup_percent: DECIMAL(5,2) NOT NULL ≥ 0
- fixed_fee: DECIMAL(10,2) NOT NULL ≥ 0
- effective_from: DATE
- effective_to: DATE
- event_id: UUID (FK → events_calendar)
```

#### 12. `settings` (Configuración)
Settings globales del sistema.

```sql
- id: UUID (PK)
- key: VARCHAR(100) NOT NULL UNIQUE
- value: TEXT NOT NULL
```

**Claves por defecto**:
- `default_markup_percent`: 60
- `production_buffer_minutes`: 120
- `low_stock_threshold`: 10

## 🔄 Flujo de Datos Principal

### 1. Crear Receta → Calcular Costo → Crear Producto

```
UI (formulario receta)
  ↓
recipeActions.createRecipe()
  ↓ validar con Zod
  ↓ insertar recipe
  ↓ insertar recipe_ingredients
  ↓ revalidatePath("/recetas")
  
productActions.createProductFromRecipe()
  ↓ calcular: SUM(quantity * cost_per_unit) / servings
  ↓ aplicar markup: base_cost * (1 + markup%)
  ↓ insertar product con costos cacheados
  ↓ revalidatePath("/productos")
```

### 2. Crear Pedido → Calcular Producción → Confirmar → Descontar Stock

```
UI (formulario pedido)
  ↓
orderActions.createOrder()
  ↓ validar con Zod
  ↓ calcular production_start:
      delivery_datetime - total_time - buffer
      buffer = max(10% * total_time, 120 min)
  ↓ insertar order + order_items
  ↓ revalidatePath("/pedidos")

Usuario hace clic en "Confirmar Pedido"
  ↓
orderActions.confirmOrder()
  ↓ llamar RPC: confirm_order_and_update_stock(order_id)
  ↓ RPC verifica stock disponible
  ↓ Si insuficiente: retornar error + lista de faltantes
  ↓ Si OK:
      - UPDATE orders SET status = 'CONFIRMED'
      - INSERT inventory_movements (type='OUT')
      - UPDATE inventory SET quantity = quantity - used
  ↓ revalidatePath("/pedidos", "/inventario")
```

## 🛠️ Funciones RPC Críticas

### 1. `calculate_recipe_cost(recipe_id UUID) → DECIMAL`

Calcula el costo total de una receta dividido por porciones.

```sql
totalCost = SUM(recipe_ingredients.quantity * ingredient.cost_per_unit)
RETURN totalCost / recipe.servings
```

### 2. `check_stock_availability(order_id UUID) → TABLE`

Verifica si hay stock suficiente para un pedido.

```sql
RETURN ingredientes donde:
  required_quantity > available_quantity

Devuelve:
  - ingredient_id
  - ingredient_name
  - required_quantity
  - available_quantity
  - shortage
```

### 3. `confirm_order_and_update_stock(order_id UUID) → JSON`

**Transacción atómica** que confirma un pedido y descuenta stock.

```sql
BEGIN TRANSACTION;

1. Verificar stock (call check_stock_availability)
2. Si hay faltantes → ROLLBACK + retornar error

3. UPDATE orders SET status = 'CONFIRMED'

4. INSERT INTO inventory_movements
   - Para cada ingrediente usado
   - quantity = -(SUM por producto)
   - type = 'OUT'

5. UPDATE inventory
   - quantity = quantity - usado

COMMIT;
RETURN { success: true, message: '...' }
```

## 🔒 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado con políticas permisivas:

```sql
CREATE POLICY "Enable all operations" ON table_name
  FOR ALL USING (true) WITH CHECK (true);
```

**Justificación**: Sistema de un solo usuario sin autenticación. En producción real con múltiples usuarios, estas políticas deben refinarse para verificar:
- `auth.uid()` (si usas Supabase Auth)
- Roles específicos (admin, cajero, etc.)

## 📡 Server Actions

Todas las operaciones CRUD se realizan mediante **Server Actions** de Next.js.

### Estructura de Respuesta

```typescript
type ActionResponse = {
  success: boolean
  message?: string
  data?: any
  shortages?: any[] // solo para stock
}
```

### Ejemplo de Server Action

```typescript
"use server"

export async function createIngredient(formData) {
  try {
    // 1. Validar con Zod
    const validated = ingredientSchema.parse(formData)

    // 2. Insertar en Supabase
    const { data, error } = await supabase
      .from("ingredients")
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    // 3. Revalidar cache de Next.js
    revalidatePath("/ingredientes")

    // 4. Retornar éxito
    return { success: true, data, message: "Creado exitosamente" }
  } catch (error) {
    return { success: false, message: error.message }
  }
}
```

## 🎨 Componentes UI

### 🎨 **Nuevo Sistema de Diseño**

**Tema Moderno y Colorido para Repostería:**
- **Colores vibrantes**: Paleta pastel con gradientes temáticos (chocolate, vainilla, fresa, menta)
- **Animaciones expresivas**: Micro-interacciones, transiciones suaves, hover effects
- **Componentes personalizados**: Botones con gradientes, tarjetas elevadas, badges coloridos
- **Tipografía expresiva**: Jerarquía visual clara con espaciado consistente

### Arquitectura de Componentes

```
app/ (páginas)
  ↓ usan
actions/ (Server Actions)
  ↓ y
components/
  ├── ui/ (shadcn/ui primitivos mejorados)
  │   ├── Button (variantes: gradient-chocolate, pastel-pink, etc.)
  │   ├── Badge (variantes: success, pastelBlue, gradientStrawberry)
  │   ├── Card (con efectos hover y sombras modernas)
  │   └── Table, Dialog, Input, etc. (con temas actualizados)
  │
  └── shared/ (componentes inteligentes)
      ├── Navbar (rediseñado con gradientes y colores únicos por sección)
      ├── NotificationToast (animaciones mejoradas con emojis)
      ├── LoadingSpinner
      ├── EmptyState
      └── ImageUpload (sube a Supabase Storage)
```

### Store de Zustand

Solo se usa para **notificaciones visuales** (no para datos de negocio).

```typescript
useNotificationStore.addNotification({
  type: "success" | "error" | "warning" | "info",
  message: "...",
  duration: 5000 // ms
})
```

## 📈 Cálculos de Negocio

### Costo de Receta

```typescript
base_cost = SUM(recipe_ingredients.quantity * ingredient.cost_per_unit) / recipe.servings
```

### Precio Sugerido

```typescript
precio_sugerido = base_cost * (1 + markup_percent / 100) + fixed_fee

// Ejemplo: costo $100, markup 60%
// precio_sugerido = 100 * 1.6 = $160
```

### Planificación de Producción

```typescript
total_time = SUM(order_items.production_time_estimate_minutes)
buffer = Math.max(total_time * 0.10, 120) // 10% o 2 horas

production_start = delivery_datetime - total_time - buffer

// Ejemplo: entrega el 25/10 a las 15:00
// total_time = 180 min (3 horas)
// buffer = 120 min (2 horas)
// production_start = 25/10 10:00
```

## 🔄 Flujos de Usuario

### Flujo: Crear Producto Completo

1. Usuario crea ingredientes (harina, azúcar, etc.)
2. Usuario crea receta "Torta de Chocolate" con esos ingredientes
3. Sistema calcula costo automáticamente
4. Usuario crea producto desde receta con markup del 60%
5. Sistema calcula precio sugerido y lo cachea
6. Usuario puede ajustar markup individual en cualquier momento

### Flujo: Procesar Pedido

1. Usuario crea pedido con productos y fecha de entrega
2. Sistema calcula `production_start` automáticamente
3. Usuario revisa y confirma pedido
4. Sistema verifica stock disponible mediante RPC
5. Si hay stock:
   - Descuenta stock atómicamente
   - Registra movimientos
   - Cambia estado a CONFIRMED
6. Si falta stock:
   - Muestra lista de ingredientes faltantes
   - Pedido permanece PENDING

## 🚀 Cómo Extender el Sistema

### Agregar un Nuevo Módulo

**Ejemplo: Agregar módulo de "Clientes"**

1. **Crear tabla en Supabase**:
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all" ON customers FOR ALL USING (true);

-- Agregar foreign key a orders
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);
```

2. **Crear validación Zod** en `lib/validations.ts`:
```typescript
export const customerSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})
```

3. **Crear Server Actions** en `actions/customerActions.ts`:
```typescript
"use server"

export async function getCustomers() { ... }
export async function createCustomer(formData) { ... }
export async function updateCustomer(id, formData) { ... }
export async function deleteCustomer(id) { ... }
```

4. **Crear página** en `app/clientes/page.tsx`:
```typescript
import { getCustomers } from "@/actions/customerActions"
// ... componente
```

5. **Agregar al Navbar** en `components/shared/Navbar.tsx`:
```typescript
{
  label: "Clientes",
  icon: Users,
  href: "/clientes",
}
```

### Agregar Nueva Funcionalidad

**Ejemplo: Exportar recetas a PDF**

1. Instalar librería: `npm install jspdf`
2. Crear función helper en `lib/utils.ts`:
```typescript
export function exportRecipeToPDF(recipe) {
  // lógica de generación PDF
}
```
3. Agregar botón en la página de recetas
4. Llamar a la función al hacer clic

## 🐛 Debugging

### Logs Importantes

```typescript
// En Server Actions
console.error("Error fetching X:", error)

// En componentes client
console.log("State:", someState)
```

### Verificar Queries de Supabase

En el dashboard de Supabase → **Database** → **Query Editor**:

```sql
-- Ver últimos pedidos
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Ver stock actual
SELECT 
  i.name,
  inv.quantity,
  inv.unit
FROM ingredients i
LEFT JOIN inventory inv ON i.id = inv.ingredient_id
ORDER BY inv.quantity ASC;

-- Ver movimientos recientes
SELECT 
  im.*,
  i.name as ingredient_name
FROM inventory_movements im
JOIN ingredients i ON im.ingredient_id = i.id
ORDER BY im.created_at DESC
LIMIT 20;
```

## 📊 Performance

### Optimizaciones Implementadas

1. **Costos cacheados**: Los productos guardan `base_cost_cache` para evitar cálculos repetidos
2. **Índices en DB**: Índices en columnas frecuentemente consultadas
3. **revalidatePath()**: Solo revalida las rutas afectadas
4. **Server Components**: La mayoría de las páginas son Server Components (no envían JS al cliente)

### Consideraciones Futuras

- **Paginación**: Si hay >100 productos, implementar paginación con TanStack Table
- **Cache de reportes**: Cachear reportes mensuales para evitar recalcular
- **Lazy loading de imágenes**: Usar Next/Image con loading="lazy"

## 🔮 Roadmap Futuro

Funcionalidades que podrían agregarse:

- [ ] **Multi-usuario**: Agregar Supabase Auth con roles (admin, cajero)
- [ ] **Notificaciones por email**: Integrar Resend o similar
- [ ] **Impresión de etiquetas**: Generar códigos QR para productos
- [ ] **Integración con MercadoPago**: Cobros online
- [ ] **App móvil**: React Native para tomar pedidos en ferias
- [ ] **Analytics avanzado**: Dashboard con métricas en tiempo real
- [ ] **Exportación masiva**: Excel/CSV de todas las tablas
- [ ] **Backup automático**: Backup diario de la base de datos

## 📚 Recursos Adicionales

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
- [TanStack Table](https://tanstack.com/table/latest)

---

**Última actualización**: Octubre 2025
**Versión del sistema**: 1.1.0


