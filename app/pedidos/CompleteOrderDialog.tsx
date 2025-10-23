"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface CompleteOrderDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (paymentStatus: 'pagado' | 'pendiente') => void
  orderId: string
  orderTotal: number
}

export function CompleteOrderDialog({
  open,
  onClose,
  onComplete,
  orderId,
  orderTotal
}: CompleteOrderDialogProps) {
  const [selectedPayment, setSelectedPayment] = useState<'pagado' | 'pendiente' | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const { t } = useTranslation()

  const handleComplete = async () => {
    if (!selectedPayment) return
    
    setIsCompleting(true)
    try {
      await onComplete(selectedPayment)
      onClose()
    } finally {
      setIsCompleting(false)
    }
  }

  const handleClose = () => {
    if (!isCompleting) {
      setSelectedPayment(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completar Pedido
          </DialogTitle>
          <DialogDescription>
            Al completar este pedido se creará automáticamente una venta. 
            ¿Esta persona ya pagó o está pendiente de pago?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total del pedido:</span>
              <span className="font-semibold text-lg">${orderTotal.toLocaleString()}</span>
            </div>
          </div>

          <RadioGroup
            value={selectedPayment || ""}
            onValueChange={(value) => setSelectedPayment(value as 'pagado' | 'pendiente')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50">
              <RadioGroupItem value="pagado" id="pagado" />
              <Label htmlFor="pagado" className="flex items-center gap-2 cursor-pointer flex-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Ya pagó</div>
                  <div className="text-sm text-gray-500">Crear venta como pagada</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50">
              <RadioGroupItem value="pendiente" id="pendiente" />
              <Label htmlFor="pendiente" className="flex items-center gap-2 cursor-pointer flex-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium">Pago pendiente</div>
                  <div className="text-sm text-gray-500">Crear venta como pendiente</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCompleting}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!selectedPayment || isCompleting}
            className="btn-gradient-green"
          >
            {isCompleting ? (
              "Completando..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Completar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
