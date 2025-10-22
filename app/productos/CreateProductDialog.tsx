"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProduct, createProductFromRecipe } from "@/actions/productActions"
import { useNotificationStore } from "@/store/notificationStore"
import { ImageUpload } from "@/components/shared/ImageUpload"

interface CreateProductDialogProps {
  open: boolean
  onClose: () => void
  recipes: any[]
}

const productFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  recipe_id: z.string().optional(),
  sku: z.string().optional(),
  base_cost_cache: z.number().min(0, "El costo debe ser mayor o igual a 0"),
  suggested_price_cache: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  markup_percent: z.number().min(0).optional(),
})

type FormData = z.infer<typeof productFormSchema>

export function CreateProductDialog({ open, onClose, recipes }: CreateProductDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [fromRecipe, setFromRecipe] = useState(true)
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      markup_percent: 60,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      let result
      if (fromRecipe && selectedRecipeId) {
        result = await createProductFromRecipe(selectedRecipeId, data.markup_percent || 60)
      } else {
        result = await createProduct({
          name: data.name,
          recipe_id: data.recipe_id,
          sku: data.sku,
          base_cost_cache: data.base_cost_cache,
          suggested_price_cache: data.suggested_price_cache,
          image_url: imageUrl || undefined,
        })
      }

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
        setImageUrl("")
        setSelectedRecipeId("")
        onClose()
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={fromRecipe ? "default" : "outline"}
              onClick={() => setFromRecipe(true)}
              className="flex-1"
            >
              Desde Receta
            </Button>
            <Button
              type="button"
              variant={!fromRecipe ? "default" : "outline"}
              onClick={() => setFromRecipe(false)}
              className="flex-1"
            >
              Manual
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fromRecipe ? (
              <>
                <div>
                  <Label htmlFor="recipe">Seleccionar Receta *</Label>
                  <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar receta" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.servings} porciones)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="markup_percent">Margen de Ganancia (%) *</Label>
                  <Input
                    id="markup_percent"
                    type="number"
                    step="0.1"
                    {...register("markup_percent", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El precio se calculará automáticamente desde el costo de la receta
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register("sku")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_cost_cache">Costo Base *</Label>
                    <Input
                      id="base_cost_cache"
                      type="number"
                      step="0.01"
                      {...register("base_cost_cache", { valueAsNumber: true })}
                    />
                    {errors.base_cost_cache && (
                      <p className="text-sm text-red-600">{errors.base_cost_cache.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="suggested_price_cache">Precio Sugerido *</Label>
                    <Input
                      id="suggested_price_cache"
                      type="number"
                      step="0.01"
                      {...register("suggested_price_cache", { valueAsNumber: true })}
                    />
                    {errors.suggested_price_cache && (
                      <p className="text-sm text-red-600">
                        {errors.suggested_price_cache.message}
                      </p>
                    )}
                  </div>
                </div>

                <ImageUpload
                  currentImageUrl={imageUrl}
                  onImageUploaded={setImageUrl}
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || (fromRecipe && !selectedRecipeId)}>
                {submitting ? "Creando..." : "Crear Producto"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

