# 🚀 Configuración PWA con Notificaciones Push

## ✅ Implementación Completada

Tu sistema Cam Bake ahora es una **Progressive Web App (PWA)** completamente funcional con notificaciones push usando **Web Push API nativo** (sin Firebase).

### 🎯 Características Implementadas

1. **PWA Instalable**
   - Icono personalizado con diseño de cupcake 🍰
   - Colores naranjas y rosas del sistema
   - Funciona en Android, iOS y escritorio
   - Banner de instalación automático

2. **Notificaciones Push (Web Push API)**
   - Nuevos pedidos
   - Cambios de estado de pedidos
   - Eventos próximos
   - Stock bajo (opcional)

3. **Optimizaciones**
   - Service Worker con caché inteligente
   - Carga rápida offline
   - Experiencia nativa
   - **Sin dependencias externas** - Usa tu Supabase existente

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Web Push API Configuration (para notificaciones push)
NEXT_PUBLIC_VAPID_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
```

### 2. Generar Claves VAPID

Ejecuta este comando para generar las claves automáticamente:

```bash
node scripts/generate-vapid-keys.js
```

Esto generará las claves VAPID necesarias para Web Push API. Copia las claves mostradas a tu archivo `.env.local`.

### 3. Migración de Base de Datos

Ejecuta la migración para crear la tabla de tokens de notificación:

```sql
-- La migración ya está creada en: supabase/migrations/20241224_notification_tokens.sql
-- Ejecuta esta migración en tu base de datos Supabase
```

### 4. Despliegue

1. **Desarrollo Local:**
   ```bash
   npm run dev
   ```

2. **Producción:**
   ```bash
   npm run build
   npm start
   ```

## 🎉 **Ventajas de Web Push API vs Firebase**

### ✅ **Web Push API (Implementado)**
- **Sin configuración externa** - No necesitas cuenta de Google
- **Más rápido** - Menos pasos de configuración
- **Integrado** con tu Supabase existente
- **Más control** - Todo en tu servidor
- **Sin límites** - No hay cuotas de notificaciones
- **Más simple** - Solo necesitas claves VAPID

### ❌ **Firebase (Eliminado)**
- Requiere cuenta de Google
- Configuración más compleja
- Dependencia externa
- Límites en plan gratuito

## 📱 Cómo Probar la PWA

### En Dispositivo Móvil

1. **Android (Chrome):**
   - Abre la app en Chrome
   - Toca el menú (3 puntos)
   - Selecciona "Agregar a pantalla de inicio"
   - Confirma la instalación

2. **iOS (Safari):**
   - Abre la app en Safari
   - Toca el botón de compartir
   - Selecciona "Agregar a pantalla de inicio"
   - Confirma la instalación

### En Escritorio

1. **Chrome/Edge:**
   - Abre la app
   - Busca el icono de instalación en la barra de direcciones
   - Haz clic en "Instalar"

## 🔔 Probar Notificaciones

### 1. Habilitar Notificaciones
- Al instalar la PWA, acepta los permisos de notificación
- O ve a Configuración > Notificaciones en la app

### 2. Crear Pedido de Prueba
1. Ve a la sección "Pedidos"
2. Crea un nuevo pedido
3. Deberías recibir una notificación push

### 3. Cambiar Estado de Pedido
1. Ve a un pedido existente
2. Cambia su estado
3. Deberías recibir una notificación

## 🛠️ Archivos Creados/Modificados

### Nuevos Archivos
- `public/manifest.json` - Configuración PWA
- `public/icons/` - Iconos en múltiples tamaños
- `lib/push-notifications.ts` - Utilidades de notificaciones
- `lib/web-push.ts` - Configuración Web Push API
- `lib/notification-service.ts` - Servicio de notificaciones
- `components/shared/InstallPrompt.tsx` - Banner de instalación
- `app/api/notifications/` - API routes para suscripciones
- `supabase/migrations/20241224_notification_tokens.sql` - Migración DB

### Archivos Modificados
- `next.config.js` - Configuración PWA con @ducanh2912/next-pwa
- `app/layout.tsx` - Meta tags PWA
- `actions/orderActions.ts` - Notificaciones de pedidos
- `actions/eventActions.ts` - Notificaciones de eventos
- `lib/supabase.ts` - Función createSupabaseClient

## 🔄 Migración a Next.js 15

### Cambios Realizados
- **Migrado de `next-pwa@5.6.0` a `@ducanh2912/next-pwa@10.2.9`**
- **Actualizada configuración de `next.config.js`** para usar `workboxOptions`
- **Eliminados archivos antiguos** del service worker (`sw.js`, `workbox-*.js`)
- **Mantenida compatibilidad** con todas las funcionalidades existentes

### Beneficios de la Migración
- ✅ **Compatible con Next.js 15 y React 19**
- ✅ **Sin errores de webpack**
- ✅ **Service Worker optimizado**
- ✅ **Mejor rendimiento**
- ✅ **Soporte completo para App Router**

## 🎨 Personalización

### Cambiar Iconos
1. Reemplaza los archivos en `public/icons/`
2. Mantén los mismos nombres de archivo
3. Usa formatos PNG o SVG

### Cambiar Colores
1. Edita `public/manifest.json`
2. Modifica `theme_color` y `background_color`
3. Actualiza los meta tags en `app/layout.tsx`

### Cambiar Nombre de la App
1. Edita `public/manifest.json`
2. Cambia `name` y `short_name`
3. Actualiza los meta tags en `app/layout.tsx`

## 🚨 Solución de Problemas

### La PWA no se puede instalar
- Verifica que estés usando HTTPS en producción
- Asegúrate de que el manifest.json sea accesible
- Revisa la consola del navegador para errores

### Las notificaciones no llegan
- Verifica las variables de entorno de VAPID
- Asegúrate de que el usuario haya aceptado los permisos
- Revisa la consola del navegador para errores
- Verifica que el service worker esté registrado

### Error de compilación
- Asegúrate de que todas las dependencias estén instaladas
- Verifica que las variables de entorno estén configuradas
- Revisa que la migración de base de datos se haya ejecutado
- Si hay errores de webpack, ejecuta `npm run build --no-cache`

### Service Worker no se actualiza
- Limpia la caché del navegador completamente
- Ejecuta `npm run build` para regenerar el service worker
- Verifica que los archivos antiguos se hayan eliminado

### Error de webpack en desarrollo
- **Solucionado:** La configuración condicional evita cargar PWA en desarrollo
- En desarrollo: PWA está completamente deshabilitada para evitar conflictos
- En producción: PWA funciona completamente con todas las funcionalidades
- Si persisten errores, ejecuta `npm run build` para verificar que funciona en producción

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica que todas las variables de entorno estén configuradas
2. Asegúrate de que las claves VAPID estén correctamente generadas
3. Revisa los logs de la consola del navegador
4. Verifica que la base de datos tenga la tabla `notification_tokens`
5. Ejecuta `npm run build` para verificar que no hay errores de compilación

¡Tu sistema Cam Bake ahora es una PWA completa con notificaciones push compatible con Next.js 15! 🎉
