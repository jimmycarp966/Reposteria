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

- ✅ **Gestión de Ingredientes**: Control de stock, costos y proveedores
- ✅ **Recetas**: Crea y gestiona recetas con cálculo automático de costos
- ✅ **Productos**: Productos con precios sugeridos y márgenes configurables
- ✅ **Pedidos**: Gestión de pedidos diarios y por efemérides
- ✅ **Calendario**: Vista de entregas y eventos programados
- ✅ **Producción**: Planificación automática de tiempos de producción
- ✅ **Reportes**: Análisis de ventas, márgenes y rendimiento
- ✅ **Configuración**: Efemérides, reglas de precio y settings globales
- ✅ **Diseño Moderno**: Interfaz colorida y expresiva para repostería

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
├── app/                      # Páginas de Next.js 15 (App Router)
│   ├── page.tsx             # Dashboard
│   ├── ingredientes/        # Gestión de ingredientes
│   ├── recetas/             # Gestión de recetas
│   ├── productos/           # Gestión de productos
│   ├── pedidos/             # Gestión de pedidos
│   ├── calendario/          # Vista de calendario
│   ├── produccion/          # Planificación de producción
│   ├── reportes/            # Reportes y análisis
│   └── configuracion/       # Configuración del sistema
├── actions/                 # Server Actions de Next.js
│   ├── ingredientActions.ts
│   ├── recipeActions.ts
│   ├── productActions.ts
│   ├── orderActions.ts
│   ├── inventoryActions.ts
│   ├── reportActions.ts
│   └── settingsActions.ts
├── components/
│   ├── ui/                  # Componentes de shadcn/ui
│   └── shared/              # Componentes compartidos
├── lib/
│   ├── supabase.ts          # Cliente de Supabase
│   ├── utils.ts             # Funciones helper
│   └── validations.ts       # Esquemas de validación Zod
├── store/
│   └── notificationStore.ts # Store de Zustand
└── supabase/
    ├── migrations/          # Migraciones SQL
    └── seeds.sql            # Datos de ejemplo
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

## 📝 Notas

- Los costos están en pesos argentinos (ARS) por defecto
- El sistema usa la fecha del sistema para todas las operaciones
- Las notificaciones son visuales únicamente (no se envían emails)

## 🤝 Contribuir

Este es un proyecto personalizado para un emprendimiento específico. Si deseas usarlo para tu propio negocio, siéntete libre de forkear y adaptarlo a tus necesidades.

## 📄 Licencia

Uso privado. Ver `architecture.md` para documentación técnica completa.

---

**Última actualización**: Octubre 2025
**Versión**: 1.1.0



#   R e p o s t e r i a  
 