"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  bucket?: string
  folder?: string
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

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

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
      addNotification({
        type: "error",
        message: error.message || "Error al subir la imagen",
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
        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
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
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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



