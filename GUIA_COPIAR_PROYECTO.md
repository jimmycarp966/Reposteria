# 📋 Guía: Cómo Copiar Este Proyecto

Esta guía te explica paso a paso cómo duplicar este proyecto completo (código + base de datos Supabase).

---

## 🎯 Resumen Rápido

**¿Qué vamos a hacer?**
- Copiar todas las tablas y funciones de Supabase al nuevo proyecto
- Duplicar la carpeta del proyecto
- Configurar las variables de entorno del nuevo proyecto

**¿Cómo funcionará?**
1. Crear nuevo proyecto en Supabase
2. Ejecutar todas las migraciones SQL en orden
3. Copiar la carpeta del proyecto
4. Cambiar variables de entorno
5. Configurar Storage bucket

**¿Qué podría salir mal?**
- Si ejecutas las migraciones en orden incorrecto → errores de dependencias
- Si olvidas alguna migración → errores de tablas faltantes
- **Mitigación**: Ejecutar las migraciones en orden numérico (001, 002, 003...)

**¿Cómo lo probamos?**
1. Verificar conexión: `node scripts/test-supabase.js`
2. Probar crear un ingrediente en la app
3. Verificar que todas las tablas existan en Supabase Dashboard

---

## 📊 Parte 1: Copiar las Tablas en Supabase

### **Método Recomendado: Usar las Migraciones SQL**

Tu proyecto ya tiene todas las migraciones SQL organizadas. Solo necesitas ejecutarlas en el nuevo proyecto de Supabase.

#### **Paso 1: Crear nuevo proyecto en Supabase**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clic en **"New Project"**
3. Completa los datos:
   - **Name**: Nombre del nuevo proyecto (ej: "Reposteria-copia")
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Elige la región más cercana
4. Espera a que se cree el proyecto (2-3 minutos)

#### **Paso 2: Ejecutar migraciones SQL en orden**

Ve a **SQL Editor** en tu nuevo proyecto de Supabase y ejecuta **en este orden**:

1. **Primero**: `supabase/migrations/001_initial_schema.sql`
   - Crea todas las tablas base (ingredients, recipes, products, inventory, etc.)

2. **Segundo**: `supabase/migrations/002_sales_and_events_extension.sql`
   - Extiende el esquema con ventas y eventos

3. **Tercero**: `supabase/migrations/003_fix_function_security.sql`
   - Corrige seguridad de funciones

4. **Luego ejecuta en orden numérico**:
   - `004_payment_status.sql`
   - `005_weekly_production_plan.sql`
   - `006_fix_payment_constraints.sql`
   - `007_fix_payment_constraints_step_by_step.sql`
   - `008_remove_recipe_ingredients_unique_constraint.sql`
   - `009_create_weekly_plan_function.sql`
   - `010_fix_week_duration_constraint.sql`
   - `011_add_task_categories.sql`
   - `012_add_duplicate_plan_function.sql`
   - `013_add_check_stock_function.sql`
   - `014_add_reorder_tasks_function.sql`
   - `015_update_confirm_order_function.sql`
   - `016_create_complete_order_with_sale_function.sql`
   - `017_add_ingredient_purchases.sql`
   - `018_create_sale_with_items_function.sql`
   - `20241224_notification_tokens.sql`
   - `20241225_price_history.sql`

5. **Opcional**: Si quieres datos de ejemplo, ejecuta `supabase/seeds.sql`

#### **Paso 3: Verificar que todo esté creado**

Ve a **Table Editor** en Supabase y verifica que existan estas tablas:
- `ingredients`
- `recipes`
- `recipe_ingredients`
- `products`
- `inventory`
- `orders`
- `sales`
- `sales_items`
- Y todas las demás que aparezcan

---

### **Método Alternativo: Exportar/Importar Datos**

Si quieres copiar **TAMBIÉN LOS DATOS** (no solo la estructura):

#### **Desde el proyecto ORIGINAL de Supabase:**

1. Ve a **SQL Editor** → **New Query**
2. Ejecuta este SQL para obtener el script completo:

```sql
-- Esto genera un script con todas las tablas y datos
-- (debes ejecutarlo desde pg_dump o usar la función de backup de Supabase)

-- Opción 1: Usar pgAdmin o DBeaver para exportar
-- Opción 2: En Supabase Dashboard → Settings → Database → Backup
```

#### **Copiar datos específicos:**

Si solo quieres copiar datos de ciertas tablas, puedes:

1. En el proyecto **ORIGINAL**, ejecuta en SQL Editor:

```sql
-- Ejemplo: Exportar ingredientes
SELECT * FROM ingredients;
```

2. Copia los resultados
3. En el proyecto **NUEVO**, ejecuta:

```sql
-- Ejemplo: Insertar ingredientes
INSERT INTO ingredients (id, name, unit, cost_per_unit, supplier, ...)
VALUES (...);
```

**⚠️ Nota**: Este método es manual. Si tienes muchos datos, mejor usa las migraciones y luego inserta datos manualmente desde la interfaz.

---

## 📁 Parte 2: Copiar la Carpeta del Proyecto

### **Paso 1: Duplicar la carpeta**

En Windows:
1. Selecciona la carpeta `Reposteria`
2. Presiona `Ctrl + C` para copiar
3. Presiona `Ctrl + V` para pegar
4. Renombra la carpeta copiada (ej: `Reposteria-copia`)

O desde terminal:

```bash
# Opción 1: Usar PowerShell
Copy-Item -Path "Reposteria" -Destination "Reposteria-copia" -Recurse

# Opción 2: Usar cmd
xcopy "Reposteria" "Reposteria-copia" /E /I /H
```

### **Paso 2: Limpiar archivos temporales (opcional)**

Elimina estos archivos/folders si existen (son temporales):

```bash
# Desde la nueva carpeta
rm -rf .next          # Caché de Next.js
rm -rf node_modules   # Dependencias (las reinstalaremos)
rm -rf .env.local     # Variables del proyecto anterior
```

---

## ⚙️ Parte 3: Configurar el Nuevo Proyecto

### **Paso 1: Instalar dependencias**

```bash
cd Reposteria-copia
npm install --legacy-peer-deps
```

### **Paso 2: Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del nuevo proyecto:

```env
# Credenciales del NUEVO proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-nuevo-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-nueva-clave-anonima

# Opcional: Si necesitas crear buckets automáticamente
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Configuración de Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**¿Dónde conseguir estas credenciales?**

1. Ve al **nuevo proyecto** en Supabase Dashboard
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (solo si necesitas crear buckets automáticamente)

### **Paso 3: Configurar Storage Bucket**

El proyecto necesita un bucket para las imágenes de productos.

**Opción A: Crear manualmente (recomendado)**

1. Ve a **Storage** en Supabase Dashboard
2. Clic en **"New bucket"**
3. Nombre: `product-images`
4. Marca **"Public bucket"** (para que las imágenes sean accesibles)
5. Clic en **"Create bucket"**

**Opción B: Automático**

Si configuraste `SUPABASE_SERVICE_ROLE_KEY`, el sistema creará el bucket automáticamente la primera vez que subas una imagen.

### **Paso 4: Verificar conexión**

```bash
node scripts/test-supabase.js
```

Deberías ver:
```
✅ Conexión exitosa a Supabase
✅ Tablas encontradas: ...
```

### **Paso 5: Ejecutar el proyecto**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y verifica que todo funcione.

---

## ✅ Checklist Final

- [ ] Nuevo proyecto de Supabase creado
- [ ] Todas las migraciones SQL ejecutadas en orden
- [ ] Tablas verificadas en Table Editor
- [ ] Carpeta del proyecto copiada
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.local` creado con nuevas credenciales
- [ ] Bucket `product-images` creado en Storage
- [ ] Conexión verificada (`node scripts/test-supabase.js`)
- [ ] Proyecto ejecutándose (`npm run dev`)
- [ ] Probado crear un ingrediente/producto

---

## 🚨 Solución de Problemas

### **Error: "Table doesn't exist"**

**Causa**: No ejecutaste todas las migraciones o en orden incorrecto.

**Solución**: 
1. Ve a SQL Editor en Supabase
2. Ejecuta las migraciones en orden numérico (001, 002, 003...)
3. Verifica en Table Editor que existan todas las tablas

### **Error: "Bucket doesn't exist"**

**Causa**: No creaste el bucket de Storage.

**Solución**: 
1. Ve a Storage en Supabase Dashboard
2. Crea un bucket llamado `product-images`
3. Márcalo como público

### **Error: "Invalid API key"**

**Causa**: Las credenciales en `.env.local` son incorrectas o del proyecto viejo.

**Solución**: 
1. Verifica que estés usando las credenciales del **nuevo** proyecto
2. Revisa que no haya espacios extra en `.env.local`
3. Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`)

### **Error: "Cannot connect to Supabase"**

**Causa**: URL incorrecta o proyecto pausado.

**Solución**: 
1. Verifica que el proyecto de Supabase esté activo (no pausado)
2. Confirma que la URL sea correcta (termina en `.supabase.co`)
3. Verifica tu conexión a internet

---

## 📝 Notas Importantes

1. **Variables de entorno**: Cada proyecto necesita su propio `.env.local` con las credenciales correctas.

2. **Storage**: Las imágenes subidas al proyecto original NO se copiarán automáticamente. Si necesitas las imágenes, descárgalas manualmente y súbelas al nuevo bucket.

3. **Datos de prueba**: Si ejecutaste `seeds.sql`, tendrás datos de ejemplo. Si no, empezarás con tablas vacías.

4. **Git**: Si usas Git, considera crear una nueva rama o repositorio para el proyecto copiado.

5. **RLS (Row Level Security)**: Las políticas de seguridad también se copian con las migraciones. Revisa si necesitas ajustarlas para tu nuevo proyecto.

---

## 🎉 ¡Listo!

Ya tienes una copia completa del proyecto. Ahora puedes modificar lo que quieras sin afectar el proyecto original.

**Próximos pasos sugeridos:**
- Cambiar el nombre de la aplicación en `package.json`
- Modificar colores/tema si es necesario
- Personalizar los textos según tu negocio
- Agregar nuevas funcionalidades


