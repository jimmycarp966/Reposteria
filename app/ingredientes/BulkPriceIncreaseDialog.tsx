"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import { bulkUpdateIngredientPrices } from "@/actions/ingredientActions"

interface BulkPriceIncreaseDialogProps {
  children: React.ReactNode
  totalIngredients: number
}

export function BulkPriceIncreaseDialog({ children, totalIngredients }: BulkPriceIncreaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [percentage, setPercentage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const percentageValue = parseFloat(percentage)
  const isValidPercentage = !isNaN(percentageValue) && percentageValue > 0 && percentageValue <= 100

  const handleFirstStep = () => {
    if (!isValidPercentage) {
      addNotification({
        type: "error",
        message: "Ingresa un porcentaje válido entre 0 y 100"
      })
      return
    }
    setShowConfirmation(true)
  }

  const handleApplyIncrease = async () => {
    if (!isValidPercentage) return

    try {
      setLoading(true)
      const result = await bulkUpdateIngredientPrices(percentageValue)

      if (result.success) {
        addNotification({
          type: "success",
          message: `✅ ${result.updatedCount} ingredientes actualizados con aumento del ${percentageValue}%`
        })
        setOpen(false)
        setPercentage("")
        setShowConfirmation(false)
        
        // Recargar la página para ver los cambios
        window.location.reload()
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al actualizar precios"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al actualizar precios"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleClose = () => {
    setOpen(false)
    setPercentage("")
    setShowConfirmation(false)
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Aumentar Precios Generales
            </DialogTitle>
          </DialogHeader>

          {!showConfirmation ? (
            // Primera pantalla: Ingresar porcentaje
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-800">
                  Esta acción aumentará el precio de <strong>TODOS los ingredientes ({totalIngredients})</strong> en base al porcentaje que ingreses.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentaje de aumento</Label>
                <div className="relative">
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ej: 15"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                {isValidPercentage && (
                  <p className="text-xs sm:text-sm text-gray-600">
                    Un ingrediente de $100 pasará a costar ${(100 * (1 + percentageValue / 100)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-yellow-800">
                  <strong>Importante:</strong> Este cambio afectará los costos de todas las recetas y productos que usan estos ingredientes.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFirstStep}
                  disabled={!isValidPercentage}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            // Segunda pantalla: Confirmación
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">⚠️ Confirmación Requerida</h3>
                    <p className="text-sm text-red-800">
                      Estás por aplicar un aumento del <strong className="text-lg">{percentageValue}%</strong> a <strong>{totalIngredients} ingredientes</strong>.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded p-3 space-y-1 text-sm">
                  <p className="text-gray-700">
                    <strong>Ejemplo:</strong>
                  </p>
                  <p className="text-gray-600">• Ingrediente de $100 → ${(100 * (1 + percentageValue / 100)).toFixed(2)}</p>
                  <p className="text-gray-600">• Ingrediente de $50 → ${(50 * (1 + percentageValue / 100)).toFixed(2)}</p>
                  <p className="text-gray-600">• Ingrediente de $200 → ${(200 * (1 + percentageValue / 100)).toFixed(2)}</p>
                </div>
              </div>

              <p className="text-sm text-center font-semibold text-gray-700">
                ¿Estás seguro de aplicar este aumento?
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  No, Cancelar
                </Button>
                <Button
                  onClick={handleApplyIncrease}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Aplicando..." : "Sí, Aplicar Aumento"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

