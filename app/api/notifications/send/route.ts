import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configurar web-push con las claves VAPID solo si están disponibles
if (process.env.NEXT_PUBLIC_VAPID_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:tu-email@ejemplo.com', // Email de contacto
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que las claves VAPID estén configuradas
    if (!process.env.NEXT_PUBLIC_VAPID_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Claves VAPID no configuradas' },
        { status: 500 }
      )
    }

    const { token, notification } = await request.json()

    if (!token || !notification) {
      return NextResponse.json(
        { success: false, message: 'Token y notificación requeridos' },
        { status: 400 }
      )
    }

    // Crear payload de notificación
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.svg',
      badge: notification.badge || '/icons/icon-72x72.svg',
      tag: notification.tag,
      data: notification.data,
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/icon-72x72.svg'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    })

    // Enviar notificación usando Web Push API
    try {
      await webpush.sendNotification(token, payload)
      
      return NextResponse.json({
        success: true,
        message: 'Notificación enviada exitosamente'
      })
    } catch (error: any) {
      console.error('Error al enviar notificación:', error)
      
      // Si el token es inválido, marcar como inactivo
      if (error.statusCode === 410 || error.statusCode === 404) {
        // TODO: Marcar token como inactivo en la base de datos
        console.log('Token inválido, debería marcarse como inactivo:', token)
      }
      
      return NextResponse.json(
        { success: false, message: 'Error al enviar notificación' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en send notification:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
