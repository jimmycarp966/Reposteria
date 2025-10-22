/**
 * Hook personalizado para manejar mutaciones con Server Actions
 * Proporciona estados de loading, error y success de manera consistente
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface UseMutationOptions<TData = any> {
  onSuccess?: (data: TData) => void
  onError?: (error: string) => void
  revalidatePaths?: string[]
  showNotification?: boolean
}

interface UseMutationResult<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<void>
  mutateAsync: (variables: TVariables) => Promise<TData | null>
  isLoading: boolean
  error: string | null
  data: TData | null
  reset: () => void
}

export function useMutation<TVariables = any, TData = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  options: UseMutationOptions<TData> = {}
): UseMutationResult<TVariables, TData> {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await mutationFn(variables)

        if (!result.success) {
          const errorMessage = result.message || 'Error desconocido'
          setError(errorMessage)
          logger.error('Mutation failed', { result }, 'useMutation')
          options.onError?.(errorMessage)
          return null
        }

        setData(result.data)
        options.onSuccess?.(result.data)

        // Revalidar rutas si se especificaron
        if (options.revalidatePaths && options.revalidatePaths.length > 0) {
          options.revalidatePaths.forEach(() => {
            router.refresh()
          })
        }

        return result.data
      } catch (err: any) {
        const errorMessage = err.message || 'Error inesperado'
        setError(errorMessage)
        logger.error('Mutation exception', err, 'useMutation')
        options.onError?.(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, options, router]
  )

  const mutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      await mutateAsync(variables)
    },
    [mutateAsync]
  )

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    data,
    reset
  }
}

