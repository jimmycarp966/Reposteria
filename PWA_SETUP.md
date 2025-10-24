# 🚀 Configuración PWA con Notificaciones Push

## ✅ Implementación Completada

Tu sistema de repostería ahora es una **Progressive Web App (PWA)** completamente funcional con notificaciones push.

### 🎯 Características Implementadas

1. **PWA Instalable**
   - Icono personalizado con diseño de cupcake 🍰
   - Colores naranjas y rosas del sistema
   - Funciona en Android, iOS y escritorio
   - Banner de instalación automático

2. **Notificaciones Push**
   - Nuevos pedidos
   - Cambios de estado de pedidos
   - Eventos próximos
   - Stock bajo (opcional)

3. **Optimizaciones**
   - Service Worker con caché inteligente
   - Carga rápida offline
   - Experiencia nativa

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Firebase Configuration (para notificaciones push)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu_vapid_key

# Firebase Server Key (para enviar notificaciones desde el servidor)
FIREBASE_SERVER_KEY=tu_firebase_server_key
```

### 2. Configuración de Firebase

#### Paso 1: Crear Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Cloud Messaging**

#### Paso 2: Configurar Web App
1. En Firebase Console, ve a "Project Settings"
2. Agrega una nueva app web
3. Copia las credenciales de configuración
4. Actualiza las variables de entorno

#### Paso 3: Generar VAPID Key
1. En Firebase Console, ve a "Project Settings"
2. En la pestaña "Cloud Messaging"
3. Genera un nuevo par de claves VAPID
4. Copia la clave pública a `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
5. Copia la clave privada a `FIREBASE_SERVER_KEY`

#### Paso 4: Configurar Service Worker
1. Descarga el archivo `firebase-messaging-sw.js` desde Firebase Console
2. Colócalo en la carpeta `public/` de tu proyecto
3. O usa el archivo que ya está configurado en `lib/firebase-config.ts`

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
- `lib/firebase-config.ts` - Configuración Firebase
- `lib/notification-service.ts` - Servicio de notificaciones
- `components/shared/InstallPrompt.tsx` - Banner de instalación
- `app/api/notifications/` - API routes para suscripciones
- `supabase/migrations/20241224_notification_tokens.sql` - Migración DB

### Archivos Modificados
- `next.config.js` - Configuración PWA
- `app/layout.tsx` - Meta tags PWA
- `actions/orderActions.ts` - Notificaciones de pedidos
- `actions/eventActions.ts` - Notificaciones de eventos
- `lib/supabase.ts` - Función createSupabaseClient

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
- Verifica las variables de entorno de Firebase
- Asegúrate de que el usuario haya aceptado los permisos
- Revisa la consola del navegador para errores
- Verifica que el service worker esté registrado

### Error de compilación
- Asegúrate de que todas las dependencias estén instaladas
- Verifica que las variables de entorno estén configuradas
- Revisa que la migración de base de datos se haya ejecutado

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica que todas las variables de entorno estén configuradas
2. Asegúrate de que Firebase esté correctamente configurado
3. Revisa los logs de la consola del navegador
4. Verifica que la base de datos tenga la tabla `notification_tokens`

¡Tu sistema de repostería ahora es una PWA completa con notificaciones push! 🎉
