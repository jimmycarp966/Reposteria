/**
 * Sistema de internacionalización (i18n)
 * Hook useTranslation para acceder a las traducciones
 */

import { messages, type Messages } from './messages'

type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

export type TranslationKey = DeepKeys<Messages>

/**
 * Obtiene un valor anidado de un objeto usando una cadena de punto
 * Ejemplo: get(messages, 'orders.title') -> 'Pedidos'
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Hook para acceder a las traducciones
 * Actualmente solo español, pero preparado para múltiples idiomas
 */
export function useTranslation() {
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(messages, key) || key

    // Reemplazar parámetros {param} en el string
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value))
      })
    }

    return translation
  }

  return { t }
}

/**
 * Función auxiliar para obtener traducciones sin hook (útil en Server Components)
 */
export function translate(key: TranslationKey, params?: Record<string, string | number>): string {
  let translation = getNestedValue(messages, key) || key

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, String(value))
    })
  }

  return translation
}

// Re-exportar messages para uso directo si es necesario
export { messages }

