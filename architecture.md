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

#### 12. `customers` (Clientes)
Clientes opcionales para las ventas.

```sql
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- email: VARCHAR(255)
- phone: VARCHAR(50)
- address: TEXT
- created_at: TIMESTAMP
```

#### 13. `sales` (Ventas)
Registro de ventas diarias realizadas.

```sql
- id: UUID (PK)
- sale_date: DATE NOT NULL DEFAULT CURRENT_DATE
- customer_id: UUID (FK → customers) nullable
- total_amount: DECIMAL(10,2) NOT NULL ≥ 0
- payment_method: VARCHAR(20) NOT NULL ∈ {efectivo, tarjeta, transferencia}
- notes: TEXT
- created_at: TIMESTAMP
```

#### 14. `sale_items` (Items de Venta)
Productos individuales de cada venta.

```sql
- id: UUID (PK)
- sale_id: UUID (FK → sales) NOT NULL
- product_id: UUID (FK → products) NOT NULL
- quantity: INTEGER NOT NULL > 0
- unit_price: DECIMAL(10,2) NOT NULL ≥ 0
- subtotal: DECIMAL(10,2) NOT NULL ≥ 0
```

#### 15. `event_products` (Productos por Efeméride)
Asociación de productos a eventos especiales.

```sql
- id: UUID (PK)
- event_id: UUID (FK → events_calendar) NOT NULL
- product_id: UUID (FK → products) NOT NULL
- special_price: DECIMAL(10,2) ≥ 0 (opcional, precio especial)
- created_at: TIMESTAMP
- UNIQUE(event_id, product_id)
```

#### 16. `settings` (Configuración)
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

## 🎯 Módulos del Sistema

El sistema está organizado en 10 módulos principales, cada uno con su propia interfaz y funcionalidad:

### 1. **Dashboard** (`/`)
Vista general con KPIs y métricas del negocio:
- Ventas del mes actual
- Margen de ganancia promedio
- Próximos pedidos (7 días)
- Ingredientes con stock bajo
- Caché: 1-2 minutos para optimizar rendimiento

### 2. **Recetas** (`/recetas`)
Gestión completa de recetas:
- Crear/editar recetas con múltiples ingredientes
- Cálculo automático de costo por porción
- Duplicar recetas para variaciones
- Versiones de recetas
- Imágenes de recetas
- **Server Actions**: `recipeActions.ts` (7 funciones)

### 3. **Ingredientes** (`/ingredientes`)
Control de ingredientes y stock:
- CRUD de ingredientes con costos unitarios
- Actualización de stock (entrada/salida)
- Gestión de proveedores y tiempos de entrega
- Alertas de stock bajo
- Imágenes de ingredientes
- **Server Actions**: `ingredientActions.ts` + `inventoryActions.ts` (11 funciones)

### 4. **Productos** (`/productos`)
Productos derivados de recetas:
- Crear productos desde recetas existentes
- Definir markup (margen de ganancia) individual
- Precio sugerido calculado automáticamente
- SKU y gestión de catálogo
- Recalcular costos cuando cambien ingredientes
- **Server Actions**: `productActions.ts` (9 funciones)

### 5. **Pedidos** (`/pedidos`)
Gestión integral de pedidos:
- Crear pedidos diarios o por efemérides
- Cálculo automático de inicio de producción
- Confirmar pedidos (descuenta stock atómicamente)
- Estados: PENDING, CONFIRMED, IN_PRODUCTION, COMPLETED, CANCELLED
- Verificación de stock antes de confirmar
- Historial de pedidos
- **Server Actions**: `orderActions.ts` (8 funciones)

### 6. **Calendario** (`/calendario`)
Vista temporal de entregas y eventos con gestión completa:
- **Vista de calendario mensual**: Grid interactivo con navegación entre meses
- **Gestión de efemérides**: Crear y administrar eventos especiales
- **Productos por efeméride**: Asociar productos específicos a cada fecha especial
- **Política de precios especiales**: Definir precios únicos para productos en efemérides
- **Estadísticas de ventas**: Ver rendimiento de cada efeméride después de ocurrida
- **Gestión de pedidos**: Visualizar entregas programadas en el calendario
- **Click en día**: Ver detalle completo de eventos y ventas del día seleccionado

### 7. **Ventas** (`/ventas`)
Sistema completo de registro de ventas diarias:
- **Carrito de compras**: Selección múltiple de productos con ajuste de cantidades
- **Gestión de clientes**: Clientes opcionales con información de contacto
- **Productos destacados**: Resalte automático de productos de efemérides del día
- **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia
- **Precios dinámicos**: Edición de precios en tiempo real durante la venta
- **Estadísticas del día**: Total de ventas, productos vendidos, ticket promedio
- **Historial de ventas**: Lista completa con filtros por fecha y cliente
- **Detalle de ventas**: Vista completa de cada transacción
- **Server Actions**: `saleActions.ts` + `customerActions.ts` (13 funciones)

### 8. **Producción** (`/produccion`)
Planificación y seguimiento de tareas:
- Lista de tareas de producción por pedido
- Estados: PENDING, IN_PROGRESS, COMPLETED
- Tiempos estimados y reales
- Vista por fecha de inicio de producción
- Actualización de duración de tareas
- **Server Actions**: `productionActions.ts` (3 funciones)

### 9. **Reportes** (`/reportes`)
Análisis y métricas del negocio:
- Estadísticas mensuales (ventas, costos, margen)
- Productos más vendidos
- Análisis de rentabilidad
- Tendencias temporales
- Exportación de datos
- **Server Actions**: `reportActions.ts` (4 funciones)

### 10. **Configuración** (`/configuracion`)
Settings globales del sistema:
- Margen de ganancia por defecto
- Buffer de producción (minutos)
- Umbral de stock bajo
- Gestión de efemérides
- Reglas de precio especiales
- **Server Actions**: `settingsActions.ts` (12 funciones)

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

### 3. Proceso de Venta Completo

```
UI (módulo de ventas)
  ↓
1. Seleccionar productos (destacando los de efemérides del día)
  ↓
2. Agregar al carrito con cantidades y precios editables
  ↓
3. Seleccionar cliente (opcional) o crear uno nuevo
  ↓
4. Elegir método de pago
  ↓
5. Confirmar venta
  ↓
saleActions.createSale()
  ↓ validar con Zod
  ↓ llamar RPC: create_sale_with_items()
  ↓ RPC calcula total automáticamente
  ↓ INSERT sale + sale_items (transaccional)
  ↓ revalidatePath("/ventas")
  ↓ mostrar notificación de éxito
```

### 4. Gestión de Productos por Efeméride

```
UI (calendario → click en día → gestionar productos)
  ↓
eventActions.getEventProducts(eventId)
  ↓ mostrar productos asociados con precios especiales
  ↓
eventActions.addProductToEvent(eventId, productId, specialPrice)
  ↓ INSERT event_products
  ↓ revalidatePath("/calendario")
  ↓
eventActions.updateEventProductPrice(eventProductId, price)
  ↓ UPDATE event_products SET special_price
  ↓ revalidatePath("/calendario")
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

### 4. `create_sale_with_items(...) → JSON`

**Transacción atómica** que crea una venta con todos sus items.

```sql
BEGIN TRANSACTION;

1. Calcular total de la venta desde items
2. INSERT INTO sales (sale_date, customer_id, total_amount, payment_method, notes)
3. INSERT INTO sale_items para cada producto
4. Calcular subtotales automáticamente

COMMIT;
RETURN { success: true, sale_id: UUID, total_amount: DECIMAL }
```

### 5. `get_event_sales_stats(event_id UUID) → JSON`

Calcula estadísticas de ventas para una efeméride específica.

```sql
SELECT 
  event_date,
  SUM(s.total_amount) as total_sales,
  SUM(si.quantity) as total_items_sold,
  COUNT(DISTINCT s.customer_id) as total_customers,
  AVG(s.total_amount) as average_ticket
FROM events_calendar e
LEFT JOIN sales s ON s.sale_date = e.date
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE e.id = event_id
GROUP BY e.date
```

### 6. `get_daily_sales_stats(date_param DATE) → JSON`

Calcula estadísticas de ventas para un día específico.

```sql
SELECT 
  date_param as date,
  SUM(total_amount) as total_sales,
  SUM(si.quantity) as total_items_sold,
  COUNT(DISTINCT customer_id) as total_customers,
  COUNT(*) as total_sales_count,
  AVG(total_amount) as average_ticket
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.sale_date = date_param
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

El sistema usa Zustand para estado global mínimo (no para datos de negocio).

#### 1. **Notification Store** (`store/notificationStore.ts`)
Gestión de notificaciones toast:

```typescript
useNotificationStore.addNotification({
  type: "success" | "error" | "warning" | "info",
  message: "...",
  duration: 5000 // ms
})
```

#### 2. **Sidebar Store** (`store/sidebarStore.ts`)
Control del sidebar móvil:

```typescript
useSidebarStore.toggleSidebar()  // Abrir/cerrar sidebar
useSidebarStore.isOpen           // Estado actual
```

**Nota importante**: Los datos de negocio (productos, pedidos, etc.) se obtienen mediante Server Actions y se refrescan con `revalidatePath()`, **no se almacenan en Zustand**.

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

## 🛠️ Scripts de Utilidad

El sistema incluye varios scripts Node.js en la carpeta `/scripts` para tareas de desarrollo y mantenimiento:

### Scripts de Testing

#### `test-supabase.js`
Verifica la conexión a Supabase y muestra información de configuración.

```bash
node scripts/test-supabase.js
```

**Uso**: Ejecutar cuando hay problemas de conexión o después de configurar variables de entorno.

#### `test-cache.js`
Prueba el sistema de caché y muestra su funcionamiento.

```bash
node scripts/test-cache.js
```

**Uso**: Verificar que el sistema de caché funciona correctamente.

### Scripts de Datos

#### `check-ingredients.js`
Verifica ingredientes en la base de datos y muestra su información.

```bash
node scripts/check-ingredients.js
```

**Uso**: Debugging de ingredientes, ver stock actual.

#### `check-recipes.js`
Verifica recetas y muestra sus ingredientes.

```bash
node scripts/check-recipes.js
```

**Uso**: Debugging de recetas, verificar costos calculados.

#### `update-ingredients.js`
Script para actualizar ingredientes en batch.

```bash
node scripts/update-ingredients.js
```

**Uso**: Actualizar costos de múltiples ingredientes.

### Scripts de Creación

#### `create-product-from-recipe.js`
Crea un producto desde una receta existente.

```bash
node scripts/create-product-from-recipe.js
```

**Uso**: Creación rápida de productos desde línea de comandos.

#### `create-tarta-recipe.js`
Ejemplo de script para crear una receta de tarta completa.

```bash
node scripts/create-tarta-recipe.js
```

**Uso**: Template para crear recetas por script.

### Scripts de Mantenimiento

#### `fix-product-name.js`
Corrige nombres de productos con formato incorrecto.

```bash
node scripts/fix-product-name.js
```

**Uso**: Limpieza de datos, corrección de nombres.

#### `clear-cache.js`
Limpia el caché del sistema manualmente.

```bash
npm run cache:clear
# o directamente:
node scripts/clear-cache.js
```

**Uso**: Cuando el caché causa problemas o después de cambios grandes en datos.

#### `optimize-dev.js`
Aplica optimizaciones al entorno de desarrollo.

```bash
npm run optimize
# o directamente:
node scripts/optimize-dev.js
```

**Uso**: Mejorar rendimiento en desarrollo.

#### `setup-env.js`
Script de configuración inicial del proyecto.

```bash
node scripts/setup-env.js
```

**Uso**: Primer setup del proyecto, crear archivo `.env.local`.

### Comandos NPM Disponibles

```bash
# Desarrollo normal
npm run dev

# Desarrollo optimizado (más memoria)
npm run dev:optimized

# Build para producción (sin linting)
npm run build

# Linting
npm run lint

# Scripts de utilidad
npm run optimize       # Aplicar optimizaciones
npm run cache:clear    # Limpiar caché
npm run test:cache     # Probar sistema de caché
```

## 📊 Performance

### Optimizaciones Implementadas

1. **Costos cacheados**: Los productos guardan `base_cost_cache` para evitar cálculos repetidos
2. **Índices en DB**: Índices en columnas frecuentemente consultadas
3. **revalidatePath()**: Solo revalida las rutas afectadas
4. **Server Components**: La mayoría de las páginas son Server Components (no envían JS al cliente)
5. **Sistema de caché en memoria**: Caché temporal para consultas frecuentes (dashboard, reportes)

### Sistema de Caché

El sistema implementa un caché en memoria simple pero efectivo:

#### `lib/cache.ts`
Caché principal con TTL (Time To Live):

```typescript
import { getCachedData, CACHE_KEYS } from '@/lib/cache'

// Obtener datos con caché automático
const data = await getCachedData(
  CACHE_KEYS.MONTHLY_STATS,
  () => fetchDataFromSupabase(),
  2 * 60 * 1000  // TTL: 2 minutos
)
```

**Características**:
- TTL configurable por dato
- Limpieza automática cada 10 minutos
- Claves predefinidas: `MONTHLY_STATS`, `UPCOMING_ORDERS`, `LOW_STOCK`, `INVENTORY`, `ORDERS`, `PRODUCTS`, `RECIPES`, `INGREDIENTS`

#### `lib/cache-utils.ts`
Utilidades para limpieza selectiva de caché:

```typescript
import { clearOrdersCache, clearInventoryCache, clearProductsCache } from '@/lib/cache-utils'

// Después de crear un pedido
clearOrdersCache()  // Limpia: orders, upcoming_orders, monthly_stats

// Después de actualizar stock
clearInventoryCache()  // Limpia: inventory, low_stock

// Después de crear/editar producto
clearProductsCache()  // Limpia: products, ingredients
```

**Funciones disponibles**:
- `clearCacheByType(type)` - Limpia un tipo específico
- `clearOrdersCache()` - Limpia caché relacionado con pedidos
- `clearInventoryCache()` - Limpia caché de inventario
- `clearProductsCache()` - Limpia caché de productos
- `clearAllCache()` - Limpia todo el caché
- `clearRelevantCache(operation)` - Limpia según la operación realizada

### Sistema de Fallback (Desarrollo)

#### `lib/supabase-fallback.ts`
Datos mock para desarrollo sin Supabase configurado:

```typescript
import { MOCK_DATA, checkSupabaseConnection, getFallbackData } from '@/lib/supabase-fallback'

// Verificar conexión
const isConnected = await checkSupabaseConnection()

// Obtener datos mock si no hay conexión
if (!isConnected) {
  const mockIngredients = getFallbackData('ingredients')
  const mockRecipes = getFallbackData('recipes')
}
```

**Incluye datos mock para**:
- Ingredientes
- Recetas
- Productos
- Pedidos
- Inventario
- Estadísticas mensuales
- Próximos pedidos
- Stock bajo

**Útil para**:
- Desarrollo sin conexión a Supabase
- Testing de interfaz
- Demos sin base de datos

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


