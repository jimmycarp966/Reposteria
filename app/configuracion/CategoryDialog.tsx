"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema } from "@/lib/validations"
import { z } from "zod"
import {
  Dialog,
  MobileDialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/mobile-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTaskCategory, updateTaskCategory } from "@/actions/categoryActions"
import { useNotificationStore } from "@/store/notificationStore"

type FormData = z.infer<typeof categorySchema>

interface CategoryDialogProps {
  open: boolean
  onClose: () => void
  category?: any
  mode: "create" | "edit"
}

export function CategoryDialog({ open, onClose, category, mode }: CategoryDialogProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#808080",
    },
  })

  const colorValue = watch("color")

  // Cargar datos de la categoría cuando esté en modo edición
  useEffect(() => {
    if (mode === "edit" && category && open) {
      reset({
        name: category.name || "",
        color: category.color || "#808080",
      })
    } else if (mode === "create" && open) {
      reset({
        name: "",
        color: "#808080",
      })
    }
  }, [category, mode, open, reset])

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      let result
      if (mode === "edit" && category) {
        result = await updateTaskCategory(category.id, data)
      } else {
        result = await createTaskCategory(data)
      }

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message!,
        })
        reset()
        onClose()
        // Refrescar los datos del servidor
        router.refresh()
      } else {
        addNotification({
          type: "error",
          message: result.message!,
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error al guardar la categoría",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {mode === "edit" ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nombre *
            </Label>
            <Input
              id="name"
              className="h-11 text-base"
              placeholder="Ej: Preparación de Masas"
              {...register("name")}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">
              Color *
            </Label>
            <div className="flex gap-3 items-center">
              <Input
                id="color"
                type="color"
                className="h-11 w-20 cursor-pointer"
                {...register("color")}
                disabled={submitting}
              />
              <Input
                type="text"
                className="h-11 text-base flex-1 font-mono"
                placeholder="#FF5733"
                {...register("color")}
                disabled={submitting}
              />
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color.message}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="h-4 w-4 rounded-full border border-gray-300"
                style={{ backgroundColor: colorValue || "#808080" }}
              />
              <span>Vista previa del color</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-[44px]"
            >
              {submitting
                ? "Guardando..."
                : mode === "edit"
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}

