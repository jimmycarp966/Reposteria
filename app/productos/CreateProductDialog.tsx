"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import type { Recipe } from "@/lib/types"

interface CreateProductDialogProps {
  open: boolean
  onClose: () => void
  recipes: Recipe[]
  onProductCreated?: () => void
}

const productFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  recipe_id: z.string().optional(),
  sku: z.string().optional(),
  base_cost_cache: z.number().min(0, "El costo debe ser mayor o igual a 0").optional(),
  suggested_price_cache: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  markup_percent: z.number().min(0, "El margen debe ser mayor o igual a 0").default(60),
})

type FormData = z.infer<typeof productFormSchema>

export function CreateProductDialog({ open, onClose, recipes, onProductCreated }: CreateProductDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [fromRecipe, setFromRecipe] = useState(recipes.length > 0)
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const form = useForm<FormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      markup_percent: 60,
    },
  })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Formulario enviado")

    if (submitting) {
      console.log("Ya hay una submisión en proceso")
      return
    }

    try {
      setSubmitting(true)
      console.log("Iniciando creación de producto", {
        fromRecipe,
        selectedRecipeId,
        markupPercent: form.getValues("markup_percent")
      })

      let result
      if (fromRecipe && selectedRecipeId) {
        const markupPercent = form.getValues("markup_percent") || 60
        console.log("Creando producto desde receta:", {
          recipeId: selectedRecipeId,
          markupPercent
        })
        
        result = await createProductFromRecipe(selectedRecipeId, markupPercent)
      } else {
        const formData = form.getValues()
        console.log("Creando producto manual:", formData)
        
        result = await createProduct({
          name: formData.name!,
          recipe_id: formData.recipe_id,
          sku: formData.sku,
          base_cost_cache: formData.base_cost_cache!,
          suggested_price_cache: formData.suggested_price_cache!,
          image_url: imageUrl || undefined,
        })
      }

      console.log("Resultado de la creación:", result)

      if (result.success) {
        addNotification({ type: "success", message: result.message || "Producto creado exitosamente" })
        form.reset()
        setImageUrl("")
        setSelectedRecipeId("")
        if (onProductCreated) {
          await onProductCreated()
        }
        onClose()
      } else {
        addNotification({ type: "error", message: result.message || "Error al crear el producto" })
      }
    } catch (error) {
      console.error("Error al crear producto:", error)
      addNotification({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Error al crear el producto" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecipeChange = (value: string) => {
    console.log("Receta seleccionada:", value)
    setSelectedRecipeId(value)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <DialogDescription>
            Crea un nuevo producto manualmente o desde una receta existente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={fromRecipe ? "default" : "outline"}
              onClick={() => {
                console.log("Cambiando a modo receta")
                setFromRecipe(true)
                setSelectedRecipeId("")
              }}
              className="flex-1"
              disabled={recipes.length === 0}
            >
              Desde Receta {recipes.length === 0 && "(No disponible)"}
            </Button>
            <Button
              type="button"
              variant={!fromRecipe ? "default" : "outline"}
              onClick={() => {
                console.log("Cambiando a modo manual")
                setFromRecipe(false)
                setSelectedRecipeId("")
              }}
              className="flex-1"
            >
              Manual
            </Button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {fromRecipe ? (
              <>
                <div>
                  <Label htmlFor="recipe">Seleccionar Receta *</Label>
                  <Select value={selectedRecipeId} onValueChange={handleRecipeChange}>
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
                  {fromRecipe && !selectedRecipeId && (
                    <p className="text-sm text-red-600 mt-1">Debes seleccionar una receta</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="markup_percent">Margen de Ganancia (%) *</Label>
                  <Input
                    id="markup_percent"
                    type="number"
                    step="0.1"
                    defaultValue="60"
                    {...form.register("markup_percent", { 
                      valueAsNumber: true,
                      required: "El margen es requerido"
                    })}
                  />
                  {form.formState.errors.markup_percent && (
                    <p className="text-sm text-red-600">{form.formState.errors.markup_percent.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    El precio se calculará automáticamente desde el costo de la receta
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...form.register("sku")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_cost_cache">Costo Base *</Label>
                    <Input
                      id="base_cost_cache"
                      type="number"
                      step="0.01"
                      {...form.register("base_cost_cache", { valueAsNumber: true })}
                    />
                    {form.formState.errors.base_cost_cache && (
                      <p className="text-sm text-red-600">{form.formState.errors.base_cost_cache.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="suggested_price_cache">Precio Sugerido *</Label>
                    <Input
                      id="suggested_price_cache"
                      type="number"
                      step="0.01"
                      {...form.register("suggested_price_cache", { valueAsNumber: true })}
                    />
                    {form.formState.errors.suggested_price_cache && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.suggested_price_cache.message}
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
              <Button 
                type="submit" 
                disabled={submitting || (fromRecipe && !selectedRecipeId)}
              >
                {submitting ? "Creando..." : "Crear Producto"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}