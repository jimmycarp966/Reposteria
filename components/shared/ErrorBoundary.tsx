"use client"

/**
 * Error Boundary para capturar errores de React y mostrarlos de manera amigable
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error
    logger.error('React Error Boundary caught error', error, 'ErrorBoundary')
    logger.error('Component stack', { componentStack: errorInfo.componentStack }, 'ErrorBoundary')

    // Callback opcional
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-600">Algo salió mal</CardTitle>
                  <CardDescription>
                    Ha ocurrido un error inesperado en la aplicación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <p className="text-sm font-mono text-gray-800 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs text-gray-600 overflow-auto max-h-48">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Intenta recargar la página. Si el problema persiste, contacta al soporte.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Intentar de nuevo
              </Button>
              <Button onClick={() => window.location.reload()}>
                Recargar página
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

