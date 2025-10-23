"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ingredientSchema } from "@/lib/validations"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createIngredient } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { UnitSelector } from "@/components/shared/UnitSelector"

interface CreateIngredientDialogProps {
  children?: React.ReactNode
  open?: boolean
  onClose?: () => void
}

type FormData = z.infer<typeof ingredientSchema>

export function CreateIngredientDialog({ children, open: externalOpen, onClose: externalOnClose }: CreateIngredientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = externalOpen !== undefined && externalOnClose !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      if (!newOpen) {
        externalOnClose?.()
      }
    } else {
      setInternalOpen(newOpen)
    }
  }
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(ingredientSchema),
  })

  const unitValue = watch("unit")

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      const result = await createIngredient({
        ...data,
        image_url: imageUrl || undefined,
      })

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
        setImageUrl("")
        handleOpenChange(false)
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ingrediente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unidad *</Label>
              <UnitSelector
                value={unitValue}
                onChange={(value) => setValue("unit", value)}
                placeholder="Seleccionar unidad"
                categories={['weight', 'volume', 'count']}
                showCategories={true}
              />
              {errors.unit && (
                <p className="text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cost_per_unit">Costo por Unidad *</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                {...register("cost_per_unit", { valueAsNumber: true })}
              />
              {errors.cost_per_unit && (
                <p className="text-sm text-red-600">{errors.cost_per_unit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Input id="supplier" {...register("supplier")} />
            </div>

            <div>
              <Label htmlFor="lead_time_days">Días de Entrega</Label>
              <div className="flex gap-2">
                <Input
                  id="lead_time_days"
                  type="number"
                  placeholder="Ej: 3"
                  {...register("lead_time_days", { valueAsNumber: true })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("lead_time_days", null)}
                  className="whitespace-nowrap"
                >
                  No aplica
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Días que tarda el proveedor en entregar. Usar "No aplica" para ingredientes del supermercado.
              </p>
            </div>
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Ingrediente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



