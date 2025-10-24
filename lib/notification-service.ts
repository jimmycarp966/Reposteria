// Re-exportar desde web-push.ts para mantener compatibilidad
export {
  sendPushNotification,
  sendNewOrderNotification,
  sendOrderStatusNotification,
  sendUpcomingEventNotification,
  sendLowStockNotification,
  type NotificationPayload
} from './web-push'

