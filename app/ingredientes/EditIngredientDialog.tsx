"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ingredientSchema } from "@/lib/validations"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateIngredient } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { UnitSelector } from "@/components/shared/UnitSelector"

interface EditIngredientDialogProps {
  ingredient: any
  open: boolean
  onClose: () => void
}

type FormData = z.infer<typeof ingredientSchema>

export function EditIngredientDialog({ ingredient, open, onClose }: EditIngredientDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState(ingredient.image_url || "")
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
    defaultValues: {
      name: ingredient.name || "",
      unit: ingredient.unit || "",
      cost_per_unit: ingredient.cost_per_unit || 0,
      supplier: ingredient.supplier || undefined,
      lead_time_days: ingredient.lead_time_days || undefined,
      image_url: ingredient.image_url || "",
    },
  })

  const unitValue = watch("unit")

  // Actualizar valores cuando cambia el ingrediente o se abre el diálogo
  useEffect(() => {
    if (open && ingredient) {
      setValue("name", ingredient.name || "")
      setValue("unit", ingredient.unit || "")
      setValue("cost_per_unit", ingredient.cost_per_unit || 0)
      setValue("supplier", ingredient.supplier || undefined)
      setValue("lead_time_days", ingredient.lead_time_days || undefined)
      setImageUrl(ingredient.image_url || "")
    }
  }, [open, ingredient, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      const result = await updateIngredient(ingredient.id, {
        ...data,
        image_url: imageUrl || undefined,
      })

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
        setImageUrl("")
        onClose()
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error: any) {
      addNotification({ type: "error", message: "Error al actualizar ingrediente" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar Ingrediente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Unidad Base *</Label>
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
            <p className="text-xs text-muted-foreground mt-1">
              La unidad en la que se medirá este ingrediente (ej: gramos para harina)
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Costo unitario del ingrediente en la unidad base
            </p>
          </div>

          <div>
            <Label htmlFor="supplier">Proveedor</Label>
            <Input id="supplier" {...register("supplier")} />
            {errors.supplier && (
              <p className="text-sm text-red-600">{errors.supplier.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
            <Input
              id="lead_time_days"
              type="number"
              step="1"
              {...register("lead_time_days", { 
                valueAsNumber: true,
                setValueAs: (value: string) => value === "" ? undefined : parseInt(value, 10)
              })}
            />
            {errors.lead_time_days && (
              <p className="text-sm text-red-600">{errors.lead_time_days.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Días que tarda el proveedor en entregar este ingrediente
            </p>
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

