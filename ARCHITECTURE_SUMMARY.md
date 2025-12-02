# Arquitectura del Sistema de Gestión para Cam Bake

## TL;DR
Sistema web completo para gestión de Cam Bake con cálculo automático de costos, gestión de pedidos, planificación de producción y reportes. Utiliza Next.js 15, Supabase y un diseño moderno responsive con colores temáticos para Cam Bake.

## Tecnologías Principales
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions
- **Base de Datos**: Supabase (PostgreSQL)
- **Estado Global**: Zustand
- **Validación**: Zod + React Hook Form
- **Tablas**: TanStack Table
- **Storage**: Supabase Storage

## Estructura de Carpetas (Alto Nivel)
```
/src/
├── app/              # Rutas y páginas (App Router)
├── components/       # UI components (ui/ y shared/)
├── actions/          # Server Actions (8 archivos con 54 funciones)
├── lib/              # Utilidades (cliente Supabase, validaciones, caché)
├── store/            # Zustand stores (notificaciones, sidebar)
└── supabase/         # Migraciones y seeds
```

## Flujo Principal del Sistema
1. **Configuración**: Usuario configura Supabase y ejecuta migraciones SQL
2. **Gestión de Datos**: Crea ingredientes → recetas → productos → pedidos
3. **Operaciones**: Confirma pedidos (descuenta stock) → producción → ventas
4. **Reportes**: Análisis de ventas, márgenes y tendencias

## 10 Puntos Clave del Diseño y Comportamiento
1. **Cálculo Automático**: Costos de recetas se calculan automáticamente por porción
2. **Transacciones Atómicas**: Operaciones críticas usan funciones RPC de PostgreSQL
3. **Sistema de Caché**: Caché inteligente con TTL para mejorar rendimiento
4. **Validaciones Completas**: Todas las operaciones validadas con Zod
5. **Modo Fallback**: Datos mock para desarrollo sin Supabase
6. **RLS Habilitado**: Row Level Security en todas las tablas
7. **Responsive Design**: 100% optimizado para móviles, tablets y desktop
8. **Paginación Universal**: Todas las listas con paginación
9. **Búsqueda Avanzada**: Búsqueda instantánea con debounce
10. **Testing Automatizado**: 85 tests con Vitest + Testing Library

## Descripción Breve de Cada Módulo Importante

### Dashboard
Vista general con KPIs del mes (ventas, margen promedio, pedidos próximos), alertas de stock bajo y próximos pedidos.

### Recetas (Recipes)
Gestión de recetas con cálculo automático de costos por porción, múltiples ingredientes y versiones.

### Ingredientes (Ingredients)
Control completo de ingredientes con stock, costos, proveedores y subida de imágenes.

### Productos (Products)
Productos derivados de recetas con precios sugeridos y márgenes configurables.

### Pedidos (Orders)
Gestión integral de pedidos diarios/efemérides con confirmación de stock y gestión de pagos.

### Ventas (Sales)
Sistema completo de registro de ventas diarias con carrito de compras.

### Calendario (Calendar)
Vista de entregas programadas y gestión de efemérides.

### Plan Semanal (Weekly Plan)
Planificación semanal de producción con tareas y recetas.

### Producción (Production)
Planificación y seguimiento de tareas de producción por pedido.

### Reportes (Reports)
Análisis detallado de ventas, márgenes, productos más vendidos y tendencias.

### Configuración (Settings)
Settings globales, efemérides y reglas de precio especiales.

### Server Actions (54 funciones)
Distribuidas en 8 archivos: recipeActions, ingredientActions, inventoryActions, productActions, orderActions, productionActions, reportActions, settingsActions.

### Sistema de Caché
Caché inteligente con TTL configurable para mejorar rendimiento, especialmente en dashboard y reportes.

