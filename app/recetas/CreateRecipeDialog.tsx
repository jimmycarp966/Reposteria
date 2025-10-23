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
import { UnitSelector } from "@/components/shared/UnitSelector"
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
                      value={field.unit}
                      onChange={(value) => setValue(`ingredients.${index}.unit`, value)}
                      placeholder="Unidad"
                      categories={['weight', 'volume', 'count']}
                    />
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

