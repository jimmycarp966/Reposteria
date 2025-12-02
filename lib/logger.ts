/**
 * Sistema de logging estructurado para el sistema Cam Bake
 * Proporciona logging con niveles, contexto y preparado para integración con servicios externos
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  context?: string
  userId?: string
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  /**
   * Formatea y envía el log al destino apropiado
   */
  private log(entry: LogEntry): void {
    // En tests, no logueamos para mantener output limpio
    if (this.isTest) return

    const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''} ${entry.message}`
    
    if (this.isDev) {
      // En desarrollo, usar console nativo
      if (entry.level === 'error') {
        console.error(formatted, entry.data || '')
      } else if (entry.level === 'warn') {
        console.warn(formatted, entry.data || '')
      } else if (entry.level === 'debug') {
        console.debug(formatted, entry.data || '')
      } else {
        console.log(formatted, entry.data || '')
      }
    } else {
      // En producción, enviar a servicio de logging
      // TODO: Integrar con Sentry, LogRocket, etc.
      this.sendToExternalService(entry)
    }
  }

  /**
   * Envía logs a servicio externo (placeholder para implementación futura)
   */
  private sendToExternalService(entry: LogEntry): void {
    // Implementar integración con servicio de logging
    // Ejemplos: Sentry, LogRocket, Datadog, etc.
    if (entry.level === 'error') {
      // Solo enviar errores en producción para reducir ruido
      // sendToSentry(entry)
    }
  }

  /**
   * Log nivel INFO - información general
   */
  info(message: string, data?: any, context?: string): void {
    this.log({
      level: 'info',
      message,
      data,
      context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log nivel WARN - advertencias
   */
  warn(message: string, data?: any, context?: string): void {
    this.log({
      level: 'warn',
      message,
      data,
      context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log nivel ERROR - errores
   */
  error(message: string, error?: Error | any, context?: string): void {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        }
      : error

    this.log({
      level: 'error',
      message,
      data: errorData,
      context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log nivel DEBUG - debugging (solo en desarrollo)
   */
  debug(message: string, data?: any, context?: string): void {
    if (!this.isDev) return // Solo en desarrollo

    this.log({
      level: 'debug',
      message,
      data,
      context,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Helper para logear inicio de operación
   */
  operationStart(operation: string, context: string, data?: any): void {
    this.debug(`🚀 Iniciando: ${operation}`, data, context)
  }

  /**
   * Helper para logear éxito de operación
   */
  operationSuccess(operation: string, context: string, data?: any): void {
    this.info(`✅ Éxito: ${operation}`, data, context)
  }

  /**
   * Helper para logear fallo de operación
   */
  operationError(operation: string, context: string, error: Error | any): void {
    this.error(`❌ Error: ${operation}`, error, context)
  }

  /**
   * Helper para logear performance
   */
  performance(operation: string, duration: number, context: string): void {
    const level = duration > 1000 ? 'warn' : 'debug'
    this.log({
      level,
      message: `⏱️  ${operation} completado en ${duration}ms`,
      data: { duration },
      context,
      timestamp: new Date().toISOString()
    })
  }
}

// Instancia singleton
export const logger = new Logger()

/**
 * Helper para medir tiempo de ejecución
 */
export function withPerformanceLog<T>(
  operation: string,
  context: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  
  return fn()
    .then((result) => {
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
      return result
    })
    .catch((error) => {
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
      throw error
    })
}

/**
 * Decorator para funciones async que automáticamente loguea
 */
export function logOperation(context: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operation = propertyKey
      logger.operationStart(operation, context, { args })

      try {
        const result = await originalMethod.apply(this, args)
        logger.operationSuccess(operation, context)
        return result
      } catch (error) {
        logger.operationError(operation, context, error)
        throw error
      }
    }

    return descriptor
  }
}

