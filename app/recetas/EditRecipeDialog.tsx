"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator } from "lucide-react"
import { editRecipeSchema } from "@/lib/validations"
import { updateRecipe } from "@/actions/recipeActions"
import { useNotificationStore } from "@/store/notificationStore"
import { UnitSelector, convertUnits, areUnitsCompatible } from "@/components/shared/UnitSelector"
import { IngredientSelector } from "@/components/shared/IngredientSelector"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface EditRecipeDialogProps {
  recipe: {
    id: string
    name: string
    description?: string
    servings: number
    image_url?: string
    recipe_ingredients: Array<{
      id: string
      quantity: number
      unit: string
      ingredient: {
        id: string
        name: string
        cost_per_unit: number
        unit: string
      }
    }>
  }
  ingredients: Array<{
    id: string
    name: string
    cost_per_unit: number
    unit: string
  }>
}

type FormData = {
  name: string
  description?: string
  servings: number
  image_url?: string
  ingredients: Array<{
    id?: string
    ingredient_id: string
    quantity: number
    unit: string
  }>
}

export function EditRecipeDialog({ recipe, ingredients }: EditRecipeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(editRecipeSchema),
    defaultValues: {
      name: recipe.name,
      description: recipe.description || "",
      servings: recipe.servings,
      image_url: recipe.image_url || "",
      ingredients: recipe.recipe_ingredients.map(ri => ({
        id: ri.id,
        ingredient_id: ri.ingredient.id,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  })

  const watchedIngredients = watch("ingredients") || []

  // Function to calculate ingredient cost with unit conversion
  const calculateIngredientCost = (ingredientId: string, quantity: number, unit: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    if (!ingredient) return 0

    if (areUnitsCompatible(ingredient.unit, unit)) {
      const convertedQuantity = convertUnits(quantity, unit, ingredient.unit)
      return convertedQuantity * ingredient.cost_per_unit
    }
    return quantity * ingredient.cost_per_unit
  }

  // Function to get total cost of all ingredients
  const getTotalCost = () => {
    return watchedIngredients.reduce((total, ingredient) => {
      if (ingredient.ingredient_id && ingredient.quantity && ingredient.unit) {
        return total + calculateIngredientCost(ingredient.ingredient_id, ingredient.quantity, ingredient.unit)
      }
      return total
    }, 0)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      
      const result = await updateRecipe(recipe.id, data)
      
      if (result.success) {
        addNotification({
          type: "success",
          message: "Receta actualizada exitosamente"
        })
        setOpen(false)
        reset()
        // Refresh the page to show updated data
        router.refresh()
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al actualizar la receta"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al actualizar la receta"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addIngredient = () => {
    append({ ingredient_id: "", quantity: 0, unit: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Editar Receta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Receta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre de la Receta</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: Tarta de Frutillas"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="servings">Porciones</Label>
              <Input
                id="servings"
                type="number"
                {...register("servings", { valueAsNumber: true })}
                placeholder="Ej: 8"
              />
              {errors.servings && (
                <p className="text-sm text-red-500 mt-1">{errors.servings.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe la receta..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="image_url">URL de Imagen (Opcional)</Label>
            <Input
              id="image_url"
              {...register("image_url")}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {errors.image_url && (
              <p className="text-sm text-red-500 mt-1">{errors.image_url.message}</p>
            )}
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Ingredientes</Label>
              <Button
                type="button"
                onClick={addIngredient}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ingrediente
              </Button>
            </div>

            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Ingrediente</div>
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-2">Unidad</div>
              <div className="col-span-3">Costo</div>
              <div className="col-span-1"></div>
            </div>

            {fields.map((field, index) => (
              <Card key={index} className="mb-2">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <IngredientSelector
                        ingredients={ingredients}
                        value={watch(`ingredients.${index}.ingredient_id`) || ""}
                        onValueChange={(value) => {
                          setValue(`ingredients.${index}.ingredient_id`, value)
                          const selectedIngredient = ingredients.find(i => i.id === value)
                          if (selectedIngredient) {
                            setValue(`ingredients.${index}.unit`, selectedIngredient.unit)
                          }
                        }}
                        placeholder="Seleccionar ingrediente"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <UnitSelector
                        value={watch(`ingredients.${index}.unit`) || ""}
                        onChange={(value) => setValue(`ingredients.${index}.unit`, value)}
                        placeholder="Unidad"
                        categories={['weight', 'volume', 'count']}
                      />
                    </div>
                    
                    <div className="col-span-3 text-sm text-muted-foreground flex items-center">
                      {(() => {
                        const ingredientId = watch(`ingredients.${index}.ingredient_id`)
                        const quantity = watch(`ingredients.${index}.quantity`)
                        const unit = watch(`ingredients.${index}.unit`)

                        if (ingredientId && quantity && unit) {
                          const ingredient = ingredients.find(i => i.id === ingredientId)
                          if (ingredient && areUnitsCompatible(ingredient.unit, unit)) {
                            const convertedQuantity = convertUnits(quantity, unit, ingredient.unit)
                            const cost = calculateIngredientCost(ingredientId, quantity, unit)
                            return (
                              <div className="text-xs">
                                <div>≈ {convertedQuantity.toFixed(2)} {ingredient.unit}</div>
                                <div className="font-semibold text-green-600">${cost.toFixed(2)}</div>
                              </div>
                            )
                          }
                        }
                        return null
                      })()}
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Costo total */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Costo Total de Ingredientes:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalCost())}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Costo calculado automáticamente con conversión de unidades
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
