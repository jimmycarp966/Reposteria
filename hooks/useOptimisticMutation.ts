/**
 * Hook para actualizaciones optimistas usando React 19's useTransition
 * Proporciona feedback inmediato al usuario mientras se procesa en el servidor
 */

import { useTransition, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface UseOptimisticMutationOptions<TData = any> {
  onSuccess?: (data: TData) => void
  onError?: (error: string) => void
  revalidatePaths?: string[]
}

interface UseOptimisticMutationResult<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<void>
  isPending: boolean
  error: string | null
  data: TData | null
}

export function useOptimisticMutation<TVariables = any, TData = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  options: UseOptimisticMutationOptions<TData> = {}
): UseOptimisticMutationResult<TVariables, TData> {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      setError(null)

      startTransition(async () => {
        try {
          logger.debug('Starting optimistic mutation', variables, 'useOptimisticMutation')
          
          const result = await mutationFn(variables)

          if (!result.success) {
            const errorMessage = result.message || 'Error desconocido'
            setError(errorMessage)
            logger.error('Optimistic mutation failed', { result }, 'useOptimisticMutation')
            options.onError?.(errorMessage)
            return
          }

          setData(result.data)
          options.onSuccess?.(result.data)
          logger.debug('Optimistic mutation succeeded', result.data, 'useOptimisticMutation')

          // Revalidar rutas
          if (options.revalidatePaths && options.revalidatePaths.length > 0) {
            options.revalidatePaths.forEach(() => {
              router.refresh()
            })
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Error inesperado'
          setError(errorMessage)
          logger.error('Optimistic mutation exception', err, 'useOptimisticMutation')
          options.onError?.(errorMessage)
        }
      })
    },
    [mutationFn, options, router]
  )

  return {
    mutate,
    isPending,
    error,
    data
  }
}

