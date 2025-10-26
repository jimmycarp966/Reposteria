"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRecipeSchema } from "@/lib/validations"
import { z } from "zod"
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
import { ImageUpload } from "@/components/shared/ImageUpload"
import { UnitSelector } from "@/components/shared/UnitSelector"
import { createRecipe } from "@/actions/recipeActions"
import { getIngredients } from "@/actions/ingredientActions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CreateRecipeDialogMobileProps {
  open: boolean
  onClose: () => void
}

export function CreateRecipeDialogMobile({
  open,
  onClose,
}: CreateRecipeDialogMobileProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [ingredients, setIngredients] = useState<Array<{
    id: string
    name: string
    cost_per_unit: number
    unit: string
  }>>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof createRecipeSchema>>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      name: "",
      description: "",
      servings: 1,
      image_url: "",
      ingredients: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  })

  // Load ingredients when dialog opens
  useEffect(() => {
    if (open) {
      const loadIngredients = async () => {
        try {
          const result = await getIngredients()
          if (result.success && result.data) {
            setIngredients(result.data)
          }
        } catch (error) {
          console.error("Error loading ingredients:", error)
        }
      }
      loadIngredients()
      reset()
      setImageUrl("")
    }
  }, [open, reset])

  const onSubmit = async (data: z.infer<typeof createRecipeSchema>) => {
    setSubmitting(true)
    try {
      const result = await createRecipe({
        ...data,
        image_url: imageUrl,
      })

      if (result.success) {
        toast.success("Receta creada exitosamente")
        onClose()
        router.refresh()
      } else {
        toast.error(result.message || "Error al crear la receta")
      }
    } catch (error) {
      console.error("Error creating recipe:", error)
      toast.error("Error al crear la receta")
    } finally {
      setSubmitting(false)
    }
  }

  const getTotalCost = () => {
    return fields.reduce((total, field, index) => {
      const ingredientId = watch(`ingredients.${index}.ingredient_id`)
      const quantity = watch(`ingredients.${index}.quantity`) || 0
      const unit = watch(`ingredients.${index}.unit`)

      if (!ingredientId || !quantity || !unit) return total

      const ingredient = ingredients.find((ing) => ing.id === ingredientId)
      if (!ingredient) return total

      // Conversión simple de unidades
      let conversionFactor = 1
      if (ingredient.unit === "kg" && unit === "g") conversionFactor = 1000
      if (ingredient.unit === "g" && unit === "kg") conversionFactor = 0.001
      if (ingredient.unit === "l" && unit === "ml") conversionFactor = 1000
      if (ingredient.unit === "ml" && unit === "l") conversionFactor = 0.001

      const convertedQuantity = quantity * conversionFactor
      return total + (ingredient.cost_per_unit * convertedQuantity)
    }, 0)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Nueva Receta</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Nombre *</Label>
            <Input
              id="name"
              {...register("name")}
              className="mt-1 h-11"
              placeholder="Nombre de la receta"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
            <Input
              id="description"
              {...register("description")}
              className="mt-1 h-11"
              placeholder="Descripción de la receta"
            />
          </div>

          {/* Porciones */}
          <div>
            <Label htmlFor="servings" className="text-sm font-medium">Porciones *</Label>
            <Input
              id="servings"
              type="number"
              className="mt-1 h-11"
              {...register("servings", { valueAsNumber: true })}
              placeholder="Número de porciones"
            />
            {errors.servings && (
              <p className="text-sm text-red-600 mt-1">{errors.servings.message}</p>
            )}
          </div>

          {/* Imagen */}
          <div>
            <Label className="text-sm font-medium">Imagen</Label>
            <div className="mt-1">
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageUploaded={setImageUrl}
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Ingredientes *</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ ingredient_id: "", quantity: 0, unit: "" })}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay ingredientes agregados</p>
                <p className="text-xs mt-1">Toca "Agregar" para comenzar</p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedIngredient = ingredients.find(
                  (ing) => ing.id === watch(`ingredients.${index}.ingredient_id`)
                )

                return (
                  <div key={field.id} className="border rounded-lg p-3 bg-card">
                    {/* Ingrediente */}
                    <div className="mb-3">
                      <Label className="text-xs font-medium text-muted-foreground">Ingrediente</Label>
                      <Select
                        value={watch(`ingredients.${index}.ingredient_id`) || ""}
                        onValueChange={(value) => setValue(`ingredients.${index}.ingredient_id`, value)}
                      >
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue placeholder="Seleccionar ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ingredients?.[index]?.ingredient_id && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.ingredients[index]?.ingredient_id?.message}
                        </p>
                      )}
                    </div>

                    {/* Cantidad y Unidad */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="mt-1 h-10"
                          {...register(`ingredients.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.ingredients?.[index]?.quantity && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.ingredients[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Unidad</Label>
                        <UnitSelector
                          value={watch(`ingredients.${index}.unit`) || ""}
                          onChange={(value) => setValue(`ingredients.${index}.unit`, value)}
                          placeholder="Unidad"
                          categories={['weight', 'volume', 'count']}
                        />
                      </div>
                    </div>

                    {/* Costo y Eliminar */}
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">Costo: </span>
                        <span className="text-sm font-semibold text-primary">
                          {selectedIngredient && watch(`ingredients.${index}.quantity`) && watch(`ingredients.${index}.unit`)
                            ? formatCurrency(
                                selectedIngredient.cost_per_unit * (watch(`ingredients.${index}.quantity`) || 0)
                              )
                            : "$0.00"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {errors.ingredients && (
              <p className="text-sm text-red-600 mt-2">
                {errors.ingredients.message}
              </p>
            )}

            {/* Costo total */}
            {fields.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg border mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Costo Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(getTotalCost())}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Costo calculado automáticamente
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer con botones */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit(onSubmit)}
            className="flex-1 h-11"
          >
            {submitting ? "Creando..." : "Crear Receta"}
          </Button>
        </div>
      </div>
    </div>
  )
}
