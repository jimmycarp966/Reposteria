'use server'

import { createSupabaseClient } from '@/lib/supabase'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

/**
 * Envía notificaciones push usando Web Push API nativo
 */
export async function sendPushNotification(notification: NotificationPayload): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createSupabaseClient()

    // Obtener todos los tokens activos
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('token')
      .eq('is_active', true)

    if (error) {
      console.error('Error al obtener tokens de notificación:', error)
      return { success: false, message: 'Error al obtener tokens de notificación' }
    }

    if (!tokens || tokens.length === 0) {
      return { success: true, message: 'No hay usuarios suscritos a notificaciones' }
    }

    // Enviar notificación a cada token usando Web Push API
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        try {
          const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              notification: {
                title: notification.title,
                body: notification.body,
                icon: notification.icon || '/icons/icon-192x192.svg',
                badge: notification.badge || '/icons/icon-72x72.svg',
                tag: notification.tag,
                data: notification.data
              }
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          return { token, success: true }
        } catch (error) {
          console.error(`Error al enviar notificación al token ${token}:`, error)
          return { token, success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return {
      success: true,
      message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`
    }

  } catch (error) {
    console.error('Error al enviar notificaciones push:', error)
    return { success: false, message: 'Error interno al enviar notificaciones' }
  }
}

/**
 * Envía notificación de nuevo pedido
 */
export async function sendNewOrderNotification(orderData: {
  id: string
  customer_name: string
  total_price: number
  delivery_date: string
  delivery_time?: string
}): Promise<void> {
  const notification: NotificationPayload = {
    title: '🍰 Nuevo Pedido Recibido',
    body: `${orderData.customer_name} - $${orderData.total_price.toFixed(2)} - ${orderData.delivery_date}`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'new-order',
    data: {
      type: 'new_order',
      order_id: orderData.id,
      url: `/pedidos`
    }
  }

  await sendPushNotification(notification)
}

/**
 * Envía notificación de cambio de estado de pedido
 */
export async function sendOrderStatusNotification(orderData: {
  id: string
  customer_name: string
  status: string
  delivery_date: string
}): Promise<void> {
  const statusMessages = {
    'PENDING': 'Pendiente',
    'CONFIRMED': 'Confirmado',
    'IN_PRODUCTION': 'En Producción',
    'READY': 'Listo',
    'DELIVERED': 'Entregado',
    'CANCELLED': 'Cancelado'
  }

  const statusText = statusMessages[orderData.status as keyof typeof statusMessages] || orderData.status

  const notification: NotificationPayload = {
    title: '📋 Estado de Pedido Actualizado',
    body: `${orderData.customer_name} - ${statusText} - ${orderData.delivery_date}`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'order-status',
    data: {
      type: 'order_status',
      order_id: orderData.id,
      status: orderData.status,
      url: `/pedidos`
    }
  }

  await sendPushNotification(notification)
}

/**
 * Envía notificación de evento próximo
 */
export async function sendUpcomingEventNotification(eventData: {
  id: string
  title: string
  date: string
  time?: string
}): Promise<void> {
  const notification: NotificationPayload = {
    title: '📅 Evento Próximo',
    body: `${eventData.title} - ${eventData.date}${eventData.time ? ` a las ${eventData.time}` : ''}`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'upcoming-event',
    data: {
      type: 'upcoming_event',
      event_id: eventData.id,
      url: `/calendario`
    }
  }

  await sendPushNotification(notification)
}

/**
 * Envía notificación de stock bajo
 */
export async function sendLowStockNotification(ingredientData: {
  id: string
  name: string
  current_stock: number
  min_stock: number
}): Promise<void> {
  const notification: NotificationPayload = {
    title: '⚠️ Stock Bajo',
    body: `${ingredientData.name}: ${ingredientData.current_stock} unidades (mínimo: ${ingredientData.min_stock})`,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'low-stock',
    data: {
      type: 'low_stock',
      ingredient_id: ingredientData.id,
      url: `/ingredientes`
    }
  }

  await sendPushNotification(notification)
}
