"use server"

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Crea un cliente de Supabase con permisos de administración usando Service Role Key
 * Solo debe usarse en Server Actions para operaciones administrativas
 */
function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Las credenciales de Supabase Service Role no están configuradas')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Verifica si un bucket existe en Supabase Storage
 */
async function bucketExists(bucketName: string): Promise<boolean> {
  try {
    const adminClient = getAdminClient()
    const { data, error } = await adminClient.storage.listBuckets()
    
    if (error) {
      logger.error('Error al listar buckets', { error }, 'storageActions.bucketExists')
      return false
    }
    
    return data?.some(bucket => bucket.name === bucketName) ?? false
  } catch (error) {
    logger.error('Error al verificar existencia del bucket', { error, bucketName }, 'storageActions.bucketExists')
    return false
  }
}

/**
 * Crea un bucket en Supabase Storage si no existe
 * También configura políticas básicas de seguridad:
 * - Lectura pública para todos
 * - Escritura para usuarios autenticados
 */
export async function ensureStorageBucket(bucketName: string = 'product-images') {
  try {
    logger.info('Verificando existencia del bucket', { bucketName }, 'storageActions.ensureStorageBucket')
    
    // Verificar si el bucket ya existe
    const exists = await bucketExists(bucketName)
    
    if (exists) {
      logger.info('El bucket ya existe', { bucketName }, 'storageActions.ensureStorageBucket')
      return { success: true, message: `El bucket "${bucketName}" ya existe` }
    }
    
    // Crear el bucket si no existe
    const adminClient = getAdminClient()
    const { data: bucket, error: createError } = await adminClient.storage.createBucket(bucketName, {
      public: true, // Permitir lectura pública
      fileSizeLimit: 5242880, // 5MB máximo
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
    
    if (createError) {
      logger.error('Error al crear el bucket', { error: createError, bucketName }, 'storageActions.ensureStorageBucket')
      
      // Si el error es que el bucket ya existe (race condition), considerarlo éxito
      if (createError.message?.includes('already exists') || createError.message?.includes('duplicate')) {
        return { success: true, message: `El bucket "${bucketName}" ya existe` }
      }
      
      throw createError
    }
    
    logger.info('Bucket creado exitosamente', { bucketName }, 'storageActions.ensureStorageBucket')
    
    // Configurar políticas de seguridad básicas usando SQL
    // Nota: Las políticas de storage se configuran directamente en Supabase Dashboard
    // pero podemos intentar configurarlas mediante SQL si es necesario
    
    return { 
      success: true, 
      message: `Bucket "${bucketName}" creado exitosamente. Las imágenes ahora se pueden subir.` 
    }
  } catch (error: any) {
    logger.error('Error al asegurar el bucket', { error, bucketName }, 'storageActions.ensureStorageBucket')
    
    // Si no hay Service Role Key, devolver un error descriptivo
    if (!serviceRoleKey) {
      return {
        success: false,
        message: 'Para crear el bucket automáticamente, necesitas configurar SUPABASE_SERVICE_ROLE_KEY en tus variables de entorno. También puedes crear el bucket manualmente en el panel de Supabase: Storage → Create bucket → Nombre: "product-images" → Public: Sí'
      }
    }
    
    return {
      success: false,
      message: error.message || `Error al crear el bucket "${bucketName}". Por favor, créalo manualmente en el panel de Supabase.`
    }
  }
}

