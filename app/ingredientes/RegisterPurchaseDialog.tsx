"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ingredientPurchaseSchema } from "@/lib/validations"
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
import { Textarea } from "@/components/ui/textarea"
import { registerPurchase } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { UnitSelector } from "@/components/shared/UnitSelector"
import { areUnitsCompatible, convertUnits } from "@/components/shared/UnitSelector"
import { formatCurrency, getTodayGMT3 } from "@/lib/utils"
import type { Ingredient } from "@/lib/types"

interface RegisterPurchaseDialogProps {
  ingredient: Ingredient
  children?: React.ReactNode
  open?: boolean
  onClose?: () => void
}

type FormData = z.infer<typeof ingredientPurchaseSchema>

export function RegisterPurchaseDialog({ 
  ingredient, 
  children, 
  open: externalOpen, 
  onClose: externalOnClose 
}: RegisterPurchaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(ingredientPurchaseSchema),
    defaultValues: {
      ingredient_id: ingredient.id,
      purchase_date: getTodayGMT3(),
      quantity_purchased: 0,
      unit_purchased: ingredient.unit,
      total_price: 0,
      supplier: ingredient.supplier || "",
      affects_stock: true,
    },
  })

  const unitPurchased = watch("unit_purchased")
  const quantityPurchased = watch("quantity_purchased")
  const totalPrice = watch("total_price")

  // Calculate preview of unit cost
  const calculatePreview = () => {
    if (!quantityPurchased || !totalPrice || quantityPurchased <= 0 || totalPrice <= 0) {
      return null
    }
    
    if (!areUnitsCompatible(unitPurchased, ingredient.unit)) {
      return "Unidades incompatibles"
    }
    
    const convertedQuantity = convertUnits(quantityPurchased, unitPurchased, ingredient.unit)
    const unitCost = totalPrice / convertedQuantity

    return `${formatCurrency(unitCost)}/${ingredient.unit}`
  }

  const preview = calculatePreview()

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      const result = await registerPurchase(data)

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Registrar Compra - {ingredient.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="purchase_date">Fecha de Compra *</Label>
            <Input 
              id="purchase_date" 
              type="date"
              {...register("purchase_date")} 
            />
            {errors.purchase_date && (
              <p className="text-sm text-red-600">{errors.purchase_date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity_purchased">Cantidad para cálculo de costo *</Label>
              <Input
                id="quantity_purchased"
                type="number"
                step="0.001"
                {...register("quantity_purchased", { valueAsNumber: true })}
              />
              {errors.quantity_purchased && (
                <p className="text-sm text-red-600">{errors.quantity_purchased.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Esta cantidad se usa para calcular el costo unitario. Solo sumará stock si activás la opción de abajo.
              </p>
            </div>

            <div>
              <Label htmlFor="unit_purchased">Unidad de Compra *</Label>
              <UnitSelector
                value={unitPurchased}
                onChange={(value) => setValue("unit_purchased", value)}
                placeholder="Seleccionar unidad"
                categories={['weight', 'volume', 'count']}
                showCategories={true}
              />
              {errors.unit_purchased && (
                <p className="text-sm text-red-600">{errors.unit_purchased.message}</p>
              )}
              {unitPurchased && !areUnitsCompatible(unitPurchased, ingredient.unit) && (
                <p className="text-sm text-yellow-600 mt-1">
                  Advertencia: Esta unidad no es compatible con {ingredient.unit}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 border rounded-md p-3 bg-muted/40">
            <input
              id="affects_stock"
              type="checkbox"
              className="mt-1 h-4 w-4"
              {...register("affects_stock")}
            />
            <div>
              <Label htmlFor="affects_stock">Esta operación debe sumar stock</Label>
              <p className="text-xs text-muted-foreground">
                Dejá esta opción activada cuando realmente entró mercadería al inventario.
                Desactivala si solo querés registrar un precio de referencia sin modificar el stock disponible.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="total_price">Precio Total Pagado *</Label>
            <Input
              id="total_price"
              type="number"
              step="0.01"
              {...register("total_price", { valueAsNumber: true })}
            />
            {errors.total_price && (
              <p className="text-sm text-red-600">{errors.total_price.message}</p>
            )}
          </div>

          {preview && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-primary">
                Costo calculado: {preview}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="supplier">Proveedor</Label>
            <Input id="supplier" {...register("supplier")} />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea 
              id="notes" 
              {...register("notes")} 
              rows={3}
              placeholder="Información adicional sobre la compra..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar Compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
