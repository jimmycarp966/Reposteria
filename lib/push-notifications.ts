'use client'

import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from './firebase-config'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private vapidKey: string | null = null
  private isSupported: boolean = false

  private constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Verifica si las notificaciones push están soportadas en el navegador
   */
  public isNotificationSupported(): boolean {
    return this.isSupported && 'Notification' in window
  }

  /**
   * Solicita permisos para mostrar notificaciones
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      throw new Error('Las notificaciones push no están soportadas en este navegador')
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error)
      throw error
    }
  }

  /**
   * Verifica si el usuario ya otorgó permisos para notificaciones
   */
  public getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied'
    }
    return Notification.permission
  }

  /**
   * Obtiene el token de registro para notificaciones push
   */
  public async getRegistrationToken(): Promise<string | null> {
    if (!this.isNotificationSupported()) {
      console.warn('Las notificaciones push no están soportadas')
      return null
    }

    if (Notification.permission !== 'granted') {
      console.warn('Los permisos de notificación no han sido otorgados')
      return null
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })
      
      if (token) {
        console.log('Token de registro obtenido:', token)
        return token
      } else {
        console.log('No se pudo obtener el token de registro')
        return null
      }
    } catch (error) {
      console.error('Error al obtener el token de registro:', error)
      return null
    }
  }

  /**
   * Configura el listener para mensajes en primer plano
   */
  public setupForegroundListener(callback: (payload: any) => void): void {
    if (!this.isNotificationSupported()) {
      return
    }

    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload)
      callback(payload)
    })
  }

  /**
   * Muestra una notificación local
   */
  public showLocalNotification(payload: NotificationPayload): void {
    if (!this.isNotificationSupported() || Notification.permission !== 'granted') {
      return
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.svg',
      badge: payload.badge || '/icons/icon-72x72.svg',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: true,
      silent: false
    })

    // Auto-cerrar la notificación después de 5 segundos
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Manejar clic en la notificación
    notification.onclick = (event) => {
      event.preventDefault()
      window.focus()
      notification.close()
      
      // Navegar a una página específica si se proporciona en los datos
      if (payload.data?.url) {
        window.location.href = payload.data.url
      }
    }
  }

  /**
   * Suscribe al usuario a notificaciones push
   */
  public async subscribeToNotifications(): Promise<boolean> {
    try {
      // Solicitar permisos
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Los permisos de notificación fueron denegados')
        return false
      }

      // Obtener token de registro
      const token = await this.getRegistrationToken()
      if (!token) {
        console.error('No se pudo obtener el token de registro')
        return false
      }

      // Enviar token al servidor para guardarlo
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        console.log('Suscripción a notificaciones exitosa')
        return true
      } else {
        console.error('Error al suscribirse a notificaciones')
        return false
      }
    } catch (error) {
      console.error('Error en la suscripción a notificaciones:', error)
      return false
    }
  }

  /**
   * Cancela la suscripción a notificaciones push
   */
  public async unsubscribeFromNotifications(): Promise<boolean> {
    try {
      const token = await this.getRegistrationToken()
      if (!token) {
        return true // Ya no está suscrito
      }

      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        console.log('Desuscripción de notificaciones exitosa')
        return true
      } else {
        console.error('Error al desuscribirse de notificaciones')
        return false
      }
    } catch (error) {
      console.error('Error en la desuscripción de notificaciones:', error)
      return false
    }
  }

  /**
   * Verifica si el usuario está suscrito a notificaciones
   */
  public async isSubscribed(): Promise<boolean> {
    const token = await this.getRegistrationToken()
    return token !== null
  }
}

// Instancia singleton
export const pushNotificationService = PushNotificationService.getInstance()

// Utilidades de conveniencia
export const requestNotificationPermission = () => pushNotificationService.requestPermission()
export const getNotificationPermission = () => pushNotificationService.getPermissionStatus()
export const subscribeToNotifications = () => pushNotificationService.subscribeToNotifications()
export const unsubscribeFromNotifications = () => pushNotificationService.unsubscribeFromNotifications()
export const isNotificationSupported = () => pushNotificationService.isNotificationSupported()
export const showLocalNotification = (payload: NotificationPayload) => pushNotificationService.showLocalNotification(payload)
