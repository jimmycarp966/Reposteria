"use client"

/**
 * Componente para mostrar alertas de error de manera consistente
 */

import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  title?: string
  className?: string
}

export function ErrorAlert({
  message,
  onDismiss,
  title = 'Error',
  className = ''
}: ErrorAlertProps) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

