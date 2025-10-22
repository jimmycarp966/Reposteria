# 🧁 Sistema de Gestión para Repostería

Sistema web completo para gestionar un emprendimiento de repostería, con cálculo automático de costos, gestión de pedidos, planificación de producción y reportes.

## 🎨 **Nuevo Diseño Moderno y Colorido**

✨ **Interfaz completamente renovada** con colores temáticos para repostería:
- **Paleta vibrante**: Colores pasteles (rosa, azul, verde, naranja) con gradientes expresivos
- **Tema chocolate**: Colores cálidos inspirados en el chocolate y vainilla
- **Animaciones suaves**: Micro-interacciones y transiciones fluidas
- **Componentes expresivos**: Botones, tarjetas y badges con personalidad
- **Navbar dinámico**: Cada sección tiene su propio color distintivo

## 🚀 Características

### Módulos Completos
- ✅ **Dashboard**: Vista general con KPIs, ventas del mes, margen promedio y alertas de stock
- ✅ **Recetas**: Crea y gestiona recetas con cálculo automático de costos por porción
- ✅ **Ingredientes**: Control completo de ingredientes con stock, costos y proveedores
- ✅ **Productos**: Productos derivados de recetas con precios sugeridos y márgenes configurables
- ✅ **Pedidos**: Gestión integral de pedidos diarios y por efemérides con confirmación de stock
- ✅ **Calendario**: Vista de entregas programadas y gestión de efemérides
- ✅ **Producción**: Planificación y seguimiento de tareas de producción por pedido
- ✅ **Reportes**: Análisis detallado de ventas, márgenes, productos más vendidos y tendencias
- ✅ **Configuración**: Settings globales, efemérides y reglas de precio especiales

### Características Técnicas
- ✅ **Diseño Moderno**: Interfaz colorida y expresiva con gradientes temáticos para repostería
- ✅ **Sistema de Caché**: Caché inteligente con TTL para mejorar rendimiento
- ✅ **Validaciones**: Todas las operaciones validadas con Zod + React Hook Form
- ✅ **Transacciones Atómicas**: Operaciones críticas usan funciones RPC de PostgreSQL
- ✅ **Modo Fallback**: Datos mock para desarrollo sin conexión a Supabase
- ✅ **Scripts de Utilidad**: 11 scripts para testing, debugging y mantenimiento
- ✅ **Optimizado**: Next.js 15 con Server Components y Server Actions
- ✅ **Testing Automatizado**: 85 tests con Vitest + Testing Library
- ✅ **TypeScript Estricto**: Tipos completos, sin `any`
- ✅ **Logging Estructurado**: Sistema profesional de logs
- ✅ **Paginación Universal**: Todas las listas con paginación
- ✅ **Búsqueda Avanzada**: Búsqueda instantánea con debounce
- ✅ **i18n Preparado**: 200+ strings organizados para internacionalización

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js Server Actions
- **Base de Datos**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (imágenes)
- **Validación**: Zod + React Hook Form
- **Estado Global**: Zustand
- **Tablas**: TanStack Table
- **Gráficos**: Recharts

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita en [supabase.com](https://supabase.com))
- npm o yarn

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd Reposteria
```

### 2. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 3. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el archivo `supabase/migrations/001_initial_schema.sql`
3. Luego ejecuta `supabase/seeds.sql` para cargar datos de ejemplo
4. Ve a **Storage** y crea un bucket llamado `product-images` con políticas públicas de lectura

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

**¿Dónde encontrar estas credenciales?**
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **URL** y **anon/public key**

**¿No tienes un proyecto de Supabase?**
- Crea uno gratuito en [supabase.com](https://supabase.com)
- El proyecto incluye PostgreSQL, autenticación y storage gratis

**¿Problemas de configuración?**
- La aplicación mostrará un mensaje de ayuda en la página de Recetas
- También puedes ejecutar `node scripts/test-supabase.js` para verificar la conexión

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
/
├── app/                        # Páginas de Next.js 15 (App Router)
│   ├── page.tsx               # Dashboard con KPIs
│   ├── recetas/               # Gestión de recetas
│   ├── ingredientes/          # Gestión de ingredientes
│   ├── productos/             # Gestión de productos
│   ├── pedidos/               # Gestión de pedidos
│   ├── calendario/            # Vista de calendario y efemérides
│   ├── produccion/            # Planificación de producción
│   ├── reportes/              # Reportes y análisis
│   └── configuracion/         # Configuración del sistema
├── actions/                   # Server Actions de Next.js (54 funciones)
│   ├── recipeActions.ts       # 7 funciones de recetas
│   ├── ingredientActions.ts   # 6 funciones de ingredientes
│   ├── inventoryActions.ts    # 5 funciones de inventario
│   ├── productActions.ts      # 9 funciones de productos
│   ├── orderActions.ts        # 8 funciones de pedidos
│   ├── productionActions.ts   # 3 funciones de producción
│   ├── reportActions.ts       # 4 funciones de reportes
│   └── settingsActions.ts     # 12 funciones de configuración
├── components/
│   ├── ui/                    # Componentes de shadcn/ui (personalizados)
│   └── shared/                # Componentes compartidos
│       ├── Navbar.tsx         # Navegación principal
│       ├── NotificationToast.tsx
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ImageUpload.tsx    # Upload a Supabase Storage
├── lib/
│   ├── supabase.ts            # Cliente de Supabase
│   ├── utils.ts               # Funciones helper
│   ├── validations.ts         # Esquemas de validación Zod
│   ├── routes.ts              # Definición de rutas del sistema
│   ├── cache.ts               # Sistema de caché con TTL
│   ├── cache-utils.ts         # Utilidades de limpieza de caché
│   └── supabase-fallback.ts   # Datos mock para desarrollo
├── store/                     # Zustand stores
│   ├── notificationStore.ts   # Notificaciones toast
│   └── sidebarStore.ts        # Estado del sidebar móvil
├── scripts/                   # Scripts de utilidad (11 scripts)
│   ├── test-supabase.js       # Verificar conexión
│   ├── test-cache.js          # Probar sistema de caché
│   ├── check-ingredients.js   # Debugging de ingredientes
│   ├── check-recipes.js       # Debugging de recetas
│   ├── create-product-from-recipe.js
│   ├── update-ingredients.js  # Actualización batch
│   ├── clear-cache.js         # Limpieza manual de caché
│   ├── optimize-dev.js        # Aplicar optimizaciones
│   └── setup-env.js           # Configuración inicial
└── supabase/
    ├── migrations/            # Migraciones SQL
    │   └── 001_initial_schema.sql
    └── seeds.sql              # Datos de ejemplo
```

## 🎯 Uso Básico

### 1. Dashboard
- Visualiza KPIs del mes: ventas, margen promedio, pedidos próximos
- Revisa ingredientes con stock bajo
- Ve próximos pedidos

### 2. Ingredientes
- Crea ingredientes con costo unitario
- Actualiza stock (entrada/salida)
- Edita costos (actualiza automáticamente productos relacionados)
- Sube imágenes

### 3. Recetas
- Crea recetas con múltiples ingredientes
- Calcula costo automático por porción
- Duplica recetas para crear variaciones
- Gestiona versiones

### 4. Productos
- Crea productos desde recetas
- Define markup (margen de ganancia)
- Precio sugerido se calcula automáticamente
- Recalcula costos cuando cambien los ingredientes

### 5. Pedidos
- Crea pedidos diarios o por efemérides
- Calcula tiempo de inicio de producción automáticamente
- Confirma pedidos (descuenta stock automáticamente)
- Visualiza por estado: Pendiente, Confirmado, En Producción, Completado

### 6. Calendario
- Vista de entregas y efemérides
- Organiza tu producción por fechas

### 7. Configuración
- Define margen global
- Configura buffer de producción
- Crea efemérides (Día de la Madre, Navidad, etc.)
- Asocia reglas de precio especiales a efemérides

## 🔐 Seguridad

- **Sin autenticación**: Este sistema está diseñado para un solo usuario (la dueña del emprendimiento)
- **RLS habilitado**: Todas las tablas tienen Row Level Security con políticas permisivas
- **Validación**: Todas las operaciones validan datos con Zod
- **Transacciones atómicas**: Operaciones críticas (confirmar pedido, descontar stock) usan funciones RPC

## 🚢 Despliegue

### Vercel (Recomendado)

1. Pushea tu código a GitHub
2. Importa el repositorio en [Vercel](https://vercel.com)
3. Configura las variables de entorno
4. Despliega

### Supabase

Ya configurado en los pasos anteriores.

## 📊 Modelo de Datos

Ver `architecture.md` para el diagrama completo de tablas, relaciones y flujos del sistema.

## 🛠️ Scripts Disponibles

El sistema incluye varios scripts de utilidad para desarrollo y mantenimiento:

### Testing y Verificación
```bash
# Verificar conexión a Supabase
node scripts/test-supabase.js

# Probar sistema de caché
node scripts/test-cache.js

# Ver ingredientes y stock
node scripts/check-ingredients.js

# Ver recetas y costos
node scripts/check-recipes.js
```

### Mantenimiento
```bash
# Limpiar caché manualmente
npm run cache:clear

# Aplicar optimizaciones de desarrollo
npm run optimize

# Desarrollo con más memoria
npm run dev:optimized
```

### Utilidades de Datos
```bash
# Actualizar ingredientes en batch
node scripts/update-ingredients.js

# Crear producto desde receta
node scripts/create-product-from-recipe.js

# Corregir nombres de productos
node scripts/fix-product-name.js

# Configuración inicial del proyecto
node scripts/setup-env.js
```

**Nota**: Todos los scripts incluyen documentación interna. Ver `architecture.md` para detalles completos de cada script.

## 🧪 Testing

El sistema incluye **85 tests automatizados** con Vitest:

```bash
# Ejecutar tests en modo watch
npm test

# Interface visual de testing
npm run test:ui

# Una ejecución (para CI/CD)
npm run test:run

# Con cobertura de código
npm run test:coverage
```

**Tests incluidos**:
- 55 tests unitarios (utils, cache, logger, validaciones, hooks)
- 10 tests de integración (cálculos de costos y tiempos)
- 20 tests de componentes UI (SearchFilter, ErrorAlert, EmptyState)

Ver `__tests__/README.md` para más detalles sobre testing.

## 🔧 Solución de Problemas Comunes

### Error: "Supabase no está configurado"
**Síntomas:** Aparece un mensaje naranja en la página de Recetas
**Solución:**
1. Verifica que existe el archivo `.env.local`
2. Confirma que las variables tienen valores reales (no "placeholder")
3. Ejecuta `node scripts/test-supabase.js` para verificar la conexión

### Error: "La tabla 'recipes' no existe"
**Síntomas:** Error al cargar datos de la base de datos
**Solución:**
1. Ve a tu proyecto de Supabase → SQL Editor
2. Ejecuta el contenido del archivo `supabase/migrations/001_initial_schema.sql`
3. Opcional: ejecuta `supabase/seeds.sql` para datos de ejemplo

### Error: "Failed to fetch" / "JWT expired"
**Síntomas:** No se puede conectar a Supabase
**Solución:**
1. Verifica tu conexión a internet
2. Confirma que las credenciales en `.env.local` son correctas
3. Ve a Supabase Dashboard y verifica que el proyecto esté activo

### Error de compilación
**Síntomas:** `npm run build` falla
**Solución:**
1. Ejecuta `npm run build -- --no-lint` para ignorar errores de linting
2. Verifica que todas las dependencias estén instaladas: `npm install`

### Dashboard lento / Datos desactualizados
**Síntomas:** El dashboard tarda en cargar o muestra datos viejos
**Solución:**
1. Limpia el caché: `npm run cache:clear`
2. Refresca la página con Ctrl+F5 (o Cmd+Shift+R en Mac)
3. El sistema usa caché de 1-2 minutos para mejorar rendimiento

### Modo de desarrollo sin Supabase
**¿No tienes Supabase configurado pero quieres ver la interfaz?**
- El sistema incluye datos mock automáticos (`lib/supabase-fallback.ts`)
- Podrás navegar por todas las páginas y ver la interfaz
- Los datos no se guardarán, pero podrás probar la UX completa
- Para activar conexión real, configura las variables en `.env.local`

## 🧪 Testing Manual Recomendado

1. **Crear receta "Torta de Chocolate"** con 3 ingredientes → verificar cálculo de costo
2. **Crear producto desde esa receta** → verificar margen aplicado correctamente
3. **Crear pedido diario** con 2 productos → verificar production_start calculado
4. **Confirmar pedido** → verificar descuento de stock en inventory
5. **Intentar confirmar pedido sin stock suficiente** → debe mostrar error con ingredientes faltantes
6. **Crear efeméride "Día de la Madre"** con regla de precio → crear pedido asociado y verificar precio especial aplicado
7. **Actualizar costo de un ingrediente** → verificar que productos relacionados se marquen para recalcular

## 🆘 Solución de Problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto de Supabase esté activo

### Imágenes no se cargan
- Verifica que el bucket `product-images` exista en Supabase Storage
- Asegúrate de que tenga políticas públicas de lectura habilitadas

### Error al confirmar pedido
- Verifica que haya stock suficiente de todos los ingredientes
- Revisa que las funciones RPC estén creadas correctamente en Supabase

## 📝 Notas Importantes

### General
- Los costos están en pesos argentinos (ARS) por defecto
- El sistema usa la fecha del sistema para todas las operaciones
- Las notificaciones son visuales únicamente (no se envían emails)
- Diseñado para un solo usuario (sin autenticación compleja)

### Performance
- **Sistema de caché**: El dashboard y reportes usan caché temporal (1-2 min)
- **Limpieza automática**: El caché se limpia cada 10 minutos automáticamente
- **Limpieza manual**: Usa `npm run cache:clear` si los datos no se actualizan

### Desarrollo
- **54 Server Actions** distribuidas en 8 archivos
- **11 scripts de utilidad** para testing y mantenimiento
- **Modo fallback**: Datos mock disponibles sin necesidad de Supabase
- **Optimización**: Usa `npm run dev:optimized` para mejor rendimiento

### Documentación
- `architecture.md`: Documentación técnica completa del sistema
- `PERFORMANCE_OPTIMIZATIONS.md`: Detalles de optimizaciones y caché
- Cada script incluye comentarios sobre su uso

## 🤝 Contribuir

Este es un proyecto personalizado para un emprendimiento específico. Si deseas usarlo para tu propio negocio, siéntete libre de forkear y adaptarlo a tus necesidades.

## 📄 Licencia

Uso privado. Ver `architecture.md` para documentación técnica completa.

---

**Última actualización**: Octubre 2025
**Versión**: 1.1.0



#   R e p o s t e r i a 
 
 