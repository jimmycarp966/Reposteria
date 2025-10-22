"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/store/notificationStore"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

export function NotificationToast() {
  const notifications = useNotificationStore((state) => state.notifications)

  return (
    <ToastProvider>
      {notifications.map((notification, index) => {
        const Icon = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info,
        }[notification.type]

        const emoji = {
          success: "✅",
          error: "❌",
          warning: "⚠️",
          info: "ℹ️",
        }[notification.type]

        const bgColor = {
          success: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg",
          error: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-lg",
          warning: "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg",
          info: "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg",
        }[notification.type]

        const iconColor = {
          success: "text-green-600",
          error: "text-red-600",
          warning: "text-yellow-600",
          info: "text-blue-600",
        }[notification.type]

        return (
          <Toast
            key={notification.id}
            className={`${bgColor} animate-slide-up border-2`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg animate-bounce-gentle">{emoji}</span>
                <Icon className={`h-5 w-5 ${iconColor} animate-pulse`} />
              </div>
              <div className="flex-1">
                <ToastDescription className="text-foreground font-medium">
                  {notification.message}
                </ToastDescription>
              </div>
            </div>
            <ToastClose className="hover:bg-black/10 rounded-full p-1 transition-colors" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}



