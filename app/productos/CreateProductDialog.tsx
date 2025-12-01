"use client"

import { useState, useEffect } from "react"
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
import { getRecipes } from "@/actions/recipeActions"
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

export function CreateProductDialog({ open, onClose, recipes: initialRecipes, onProductCreated }: CreateProductDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [fromRecipe, setFromRecipe] = useState(initialRecipes.length > 0)
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Filtrar recipes basado en el término de búsqueda
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Función para refrescar las recipes
  const refreshRecipes = async () => {
    try {
      setLoadingRecipes(true)
      const result = await getRecipes({ page: 1, pageSize: 1000, activeOnly: true })
      if (result.success && result.data) {
        setRecipes(result.data)
      }
    } catch (error) {
      console.error("Error refreshing recipes:", error)
    } finally {
      setLoadingRecipes(false)
    }
  }

  // Refrescar recipes cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      refreshRecipes()
      // Resetear estado cuando se abre
      setSelectedRecipeId("")
      setSearchTerm("")
      setImageUrl("")
      form.reset()
    }
  }, [open])

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
          markupPercent,
          customImageUrl: imageUrl || undefined
        })
        
        result = await createProductFromRecipe(selectedRecipeId, markupPercent, imageUrl || undefined)
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
                setSearchTerm("")
              }}
              className="flex-1"
              disabled={loadingRecipes || recipes.length === 0}
            >
              Desde Receta {loadingRecipes ? "(Cargando...)" : recipes.length === 0 ? "(No disponible)" : `(${recipes.length} disponibles)`}
            </Button>
            <Button
              type="button"
              variant={!fromRecipe ? "default" : "outline"}
              onClick={() => {
                console.log("Cambiando a modo manual")
                setFromRecipe(false)
                setSelectedRecipeId("")
                setSearchTerm("")
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
                  <Select value={selectedRecipeId} onValueChange={(value) => setSelectedRecipeId(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar receta" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <div className="p-2 sticky top-0 bg-background border-b">
                        <Input
                          placeholder="Buscar receta..."
                          value={searchTerm}
                          onChange={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSearchTerm(e.target.value)
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-full"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto">
                        {filteredRecipes.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {loadingRecipes ? "Cargando recetas..." : "No se encontraron recetas."}
                          </div>
                        ) : (
                          filteredRecipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{recipe.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {recipe.servings} porciones
                                  {recipe.description && ` • ${recipe.description}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </div>
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

                <ImageUpload
                  currentImageUrl={imageUrl}
                  onImageUploaded={setImageUrl}
                  bucket="product-images"
                  folder="products"
                />
                {imageUrl && (
                  <p className="text-xs text-muted-foreground">
                    La imagen personalizada sobrescribirá la imagen de la receta
                  </p>
                )}
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
                  bucket="product-images"
                  folder="products"
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