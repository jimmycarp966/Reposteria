"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRecipeSchema } from "@/lib/validations"
import { z } from "zod"
import { createRecipe } from "@/actions/recipeActions"
import { getIngredients } from "@/actions/ingredientActions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SimpleMobileDialogProps {
  open: boolean
  onClose: () => void
}

export function SimpleMobileDialog({ open, onClose }: SimpleMobileDialogProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [ingredients, setIngredients] = useState<any[]>([])

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

  if (!open) return null

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white',
          flexShrink: 0
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Nueva Receta</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Content */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px'
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Nombre *
            </label>
            <input
              {...register("name")}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Nombre de la receta"
            />
            {errors.name && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Descripción
            </label>
            <input
              {...register("description")}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Descripción de la receta"
            />
          </div>

          {/* Porciones */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Porciones *
            </label>
            <input
              type="number"
              {...register("servings", { valueAsNumber: true })}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Número de porciones"
            />
            {errors.servings && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
                {errors.servings.message}
              </p>
            )}
          </div>

          {/* Ingredientes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Ingredientes *</label>
              <button
                type="button"
                onClick={() => append({ ingredient_id: "", quantity: 0, unit: "" })}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Agregar
              </button>
            </div>

            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>No hay ingredientes agregados</p>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Toca "Agregar" para comenzar</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fields.map((field, index) => {
                const selectedIngredient = ingredients.find(
                  (ing) => ing.id === watch(`ingredients.${index}.ingredient_id`)
                )

                return (
                  <div 
                    key={field.id} 
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    {/* Ingrediente */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                        Ingrediente
                      </label>
                      <select
                        value={watch(`ingredients.${index}.ingredient_id`) || ""}
                        onChange={(e) => setValue(`ingredients.${index}.ingredient_id`, e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Seleccionar ingrediente</option>
                        {ingredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </option>
                        ))}
                      </select>
                      {errors.ingredients?.[index]?.ingredient_id && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
                          {errors.ingredients[index]?.ingredient_id?.message}
                        </p>
                      )}
                    </div>

                    {/* Cantidad y Unidad */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                          Cantidad
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          {...register(`ingredients.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.ingredients?.[index]?.quantity && (
                          <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
                            {errors.ingredients[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                          Unidad
                        </label>
                        <select
                          value={watch(`ingredients.${index}.unit`) || ""}
                          onChange={(e) => setValue(`ingredients.${index}.unit`, e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Unidad</option>
                          <option value="g">Gramos (g)</option>
                          <option value="kg">Kilogramos (kg)</option>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="l">Litros (l)</option>
                          <option value="pcs">Piezas (pcs)</option>
                        </select>
                      </div>
                    </div>

                    {/* Costo y Eliminar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Costo: </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                          {selectedIngredient && watch(`ingredients.${index}.quantity`) && watch(`ingredients.${index}.unit`)
                            ? formatCurrency(
                                selectedIngredient.cost_per_unit * (watch(`ingredients.${index}.quantity`) || 0)
                              )
                            : "$0.00"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {errors.ingredients && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px' }}>
                {errors.ingredients.message}
              </p>
            )}

            {/* Costo total */}
            {fields.length > 0 && (
              <div 
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  marginTop: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Costo Total:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>
                    {formatCurrency(fields.reduce((total, field, index) => {
                      const ingredientId = watch(`ingredients.${index}.ingredient_id`)
                      const quantity = watch(`ingredients.${index}.quantity`) || 0
                      const ingredient = ingredients.find((ing) => ing.id === ingredientId)
                      if (!ingredient) return total
                      return total + (ingredient.cost_per_unit * quantity)
                    }, 0))}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Costo calculado automáticamente
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div 
        style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          padding: '16px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit(onSubmit)}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              color: 'white',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? "Creando..." : "Crear Receta"}
          </button>
        </div>
      </div>
    </div>
  )
}






