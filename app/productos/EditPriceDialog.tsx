"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProductPrice, refreshProductCost } from "@/actions/productActions"
import { useNotificationStore } from "@/store/notificationStore"
import { formatCurrency } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

interface EditPriceDialogProps {
  open: boolean
  onClose: () => void
  product: any
}

export function EditPriceDialog({ open, onClose, product }: EditPriceDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const currentMargin = product.base_cost_cache > 0
    ? ((product.suggested_price_cache - product.base_cost_cache) / product.base_cost_cache) * 100
    : 0

  const {
    register,
    handleSubmit,
    watch,
  } = useForm({
    defaultValues: {
      markup_percent: currentMargin,
    },
  })

  const markupPercent = watch("markup_percent")
  const newPrice = product.base_cost_cache * (1 + (markupPercent || 0) / 100)

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true)
      const result = await updateProductPrice(product.id, data.markup_percent)

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        onClose()
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefreshCost = async () => {
    if (!product.recipe_id) {
      addNotification({ 
        type: "error", 
        message: "Este producto no tiene receta asociada" 
      })
      return
    }

    setRefreshing(true)
    const result = await refreshProductCost(product.id)
    setRefreshing(false)

    if (result.success) {
      addNotification({ type: "success", message: result.message! })
      onClose()
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Precio - {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Costo Base Actual:</span>
              <span className="font-bold">{formatCurrency(product.base_cost_cache)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Precio Actual:</span>
              <span className="font-bold text-primary">
                {formatCurrency(product.suggested_price_cache)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Margen Actual:</span>
              <span className="font-bold">{currentMargin.toFixed(1)}%</span>
            </div>
          </div>

          {product.recipe_id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRefreshCost}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Recalcular Costo desde Ingredientes
            </Button>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="markup_percent">Nuevo Margen de Ganancia (%)</Label>
              <Input
                id="markup_percent"
                type="number"
                step="0.1"
                {...register("markup_percent", { valueAsNumber: true })}
              />
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200">
              <p className="text-sm text-muted-foreground mb-1">Nuevo Precio Calculado:</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(newPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Margen: {markupPercent?.toFixed(1) || 0}%
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Actualizando..." : "Actualizar Precio"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

