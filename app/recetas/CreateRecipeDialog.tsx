"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRecipeSchema } from "@/lib/validations"
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
import { createRecipe } from "@/actions/recipeActions"
import { getIngredients } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { UnitSelector, convertUnits, areUnitsCompatible } from "@/components/shared/UnitSelector"
import { Plus, Trash2 } from "lucide-react"

interface CreateRecipeDialogProps {
  open: boolean
  onClose: () => void
}

type FormData = z.infer<typeof createRecipeSchema>

export function CreateRecipeDialog({ open, onClose }: CreateRecipeDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [ingredients, setIngredients] = useState<any[]>([])
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      ingredients: [{ ingredient_id: "", quantity: 0, unit: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  })

  useEffect(() => {
    if (open) {
      loadIngredients()
    }
  }, [open])

  const loadIngredients = async () => {
    const result = await getIngredients()
    if (result.success) {
      setIngredients(result.data || [])
    }
  }

  // Función para calcular el costo de un ingrediente con conversión de unidades
  const calculateIngredientCost = (ingredientId: string, quantity: number, unit: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    if (!ingredient) return 0

    // Si las unidades son compatibles, convertir
    if (areUnitsCompatible(ingredient.unit, unit)) {
      const convertedQuantity = convertUnits(quantity, unit, ingredient.unit)
      return convertedQuantity * ingredient.cost_per_unit
    }

    // Si no son compatibles, usar el costo directo (asumiendo que el usuario sabe lo que hace)
    return quantity * ingredient.cost_per_unit
  }

  // Función para obtener el costo total de todos los ingredientes
  const getTotalCost = () => {
    const ingredientsData = watch('ingredients') || []
    return ingredientsData.reduce((total, ingredient) => {
      if (ingredient.ingredient_id && ingredient.quantity && ingredient.unit) {
        return total + calculateIngredientCost(ingredient.ingredient_id, ingredient.quantity, ingredient.unit)
      }
      return total
    }, 0)
  }


  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      const result = await createRecipe({
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Receta</DialogTitle>
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
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div>
            <Label htmlFor="servings">Porciones *</Label>
            <Input
              id="servings"
              type="number"
              {...register("servings", { valueAsNumber: true })}
            />
            {errors.servings && (
              <p className="text-sm text-red-600">{errors.servings.message}</p>
            )}
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
          />

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label>Ingredientes *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ ingredient_id: "", quantity: 0, unit: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ingrediente
              </Button>
            </div>

            {/* Headers de la tabla */}
            <div className="hidden lg:flex gap-2 items-center text-sm font-medium text-muted-foreground mb-2 px-2">
              <div className="flex-1">Ingrediente</div>
              <div className="w-28">Cantidad</div>
              <div className="w-32">Unidad</div>
              <div className="w-24">Costo</div>
              <div className="w-10"></div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Select
                      value={watch(`ingredients.${index}.ingredient_id`) || ""}
                      onValueChange={(value) => {
                        setValue(`ingredients.${index}.ingredient_id`, value)
                        // Auto-fill unit from ingredient
                        const ingredient = ingredients.find(i => i.id === value)
                        if (ingredient) {
                          setValue(`ingredients.${index}.unit`, ingredient.unit)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ingredients?.[index]?.ingredient_id && (
                      <p className="text-sm text-red-600">
                        {errors.ingredients[index]?.ingredient_id?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Cantidad"
                      {...register(`ingredients.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.ingredients?.[index]?.quantity && (
                      <p className="text-sm text-red-600">
                        {errors.ingredients[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-32">
                    <UnitSelector
                      value={watch(`ingredients.${index}.unit`) || ""}
                      onChange={(value) => setValue(`ingredients.${index}.unit`, value)}
                      placeholder="Unidad"
                      categories={['weight', 'volume', 'count']}
                    />
                  </div>

                  <div className="w-24 text-sm text-muted-foreground flex items-center">
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

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.ingredients && (
              <p className="text-sm text-red-600 mt-2">
                {errors.ingredients.message}
              </p>
            )}

            {/* Costo total */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Costo Total de Ingredientes:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${getTotalCost().toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Costo calculado automáticamente con conversión de unidades
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Receta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

