"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import { ensureStorageBucket } from "@/actions/storageActions"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  bucket?: string
  folder?: string
}

/**
 * Obtiene un mensaje de error descriptivo basado en el error de Supabase Storage
 */
function getErrorMessage(error: any): string {
  const errorMessage = error?.message || ""
  const errorStatus = error?.statusCode || error?.status

  // Error de bucket no encontrado
  if (errorMessage.includes("Bucket not found") || errorMessage.includes("bucket not found")) {
    return "El bucket de almacenamiento no existe. El sistema intentará crearlo automáticamente. Si el problema persiste, verifica la configuración de Supabase Storage."
  }

  // Error de permisos RLS
  if (
    errorMessage.includes("row-level security policy") ||
    errorMessage.includes("RLS") ||
    errorMessage.includes("permission denied") ||
    errorStatus === 403
  ) {
    return "No tienes permisos para subir imágenes. Verifica las políticas de seguridad del bucket en Supabase."
  }

  // Error de archivo duplicado
  if (errorMessage.includes("already exists") || errorStatus === 409) {
    return "Esta imagen ya existe. Intenta con otro archivo."
  }

  // Error de tamaño de payload
  if (errorMessage.includes("Payload too large") || errorStatus === 413) {
    return "La imagen es demasiado grande. El tamaño máximo permitido es 5MB."
  }

  // Error de conexión
  if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorStatus === 0) {
    return "Error de conexión. Verifica tu conexión a internet e intenta nuevamente."
  }

  // Error de autenticación
  if (errorStatus === 401) {
    return "Sesión expirada. Por favor, recarga la página e intenta nuevamente."
  }

  // Error del servidor
  if (errorStatus >= 500) {
    return "Error del servidor. Por favor, intenta nuevamente en unos momentos."
  }

  // Mensaje genérico con el error original si está disponible
  return errorMessage || "Error al subir la imagen. Por favor, intenta nuevamente."
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  bucket = "product-images",
  folder = "uploads",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Sincronizar preview con currentImageUrl cuando cambia (para resetear formularios)
  useEffect(() => {
    setPreview(currentImageUrl || null)
  }, [currentImageUrl])

  /**
   * Asegura que el bucket existe, creándolo automáticamente si es necesario
   */
  const ensureBucketExists = async (): Promise<boolean> => {
    try {
      const result = await ensureStorageBucket(bucket)
      
      if (!result.success) {
        addNotification({
          type: "error",
          message: result.message || `No se pudo crear el bucket "${bucket}". ${result.message || 'Por favor, créalo manualmente en el panel de Supabase.'}`,
        })
        return false
      }
      
      // Si el bucket se creó exitosamente, mostrar notificación informativa
      if (result.message?.includes("creado exitosamente")) {
        addNotification({
          type: "success",
          message: result.message,
        })
      }
      
      return true
    } catch (error) {
      console.error("Error al asegurar el bucket:", error)
      addNotification({
        type: "error",
        message: `Error al verificar el bucket "${bucket}". Por favor, verifica tu configuración de Supabase.`,
      })
      return false
    }
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Asegurar que el bucket existe antes de intentar subir (lo crea automáticamente si no existe)
      const bucketReady = await ensureBucketExists()
      if (!bucketReady) {
        setUploading(false)
        return
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onImageUploaded(publicUrl)

      addNotification({
        type: "success",
        message: "Imagen subida exitosamente",
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      const errorMessage = getErrorMessage(error)
      addNotification({
        type: "error",
        message: errorMessage,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        addNotification({
          type: "error",
          message: "Por favor selecciona un archivo de imagen",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: "error",
          message: "La imagen no debe superar los 5MB",
        })
        return
      }

      uploadImage(file)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onImageUploaded("")
  }

  return (
    <div className="space-y-4">
      <Label>Imagen</Label>
      
      {preview ? (
        <div className="relative w-full h-40 md:h-48 border rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 md:p-8 text-center">
          <Upload className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-muted-foreground" />
          <Label
            htmlFor="image-upload"
            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            Haz clic para subir una imagen
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}
      
      {uploading && (
        <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
      )}
    </div>
  )
}