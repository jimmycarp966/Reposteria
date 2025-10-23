"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { registerOrderPayment } from "@/actions/orderActions"
import { useNotificationStore } from "@/store/notificationStore"
import { formatCurrency } from "@/lib/utils"
import { CreditCard } from "lucide-react"

interface RegisterPaymentDialogProps {
  orderId: string
  orderTotal: number
  currentPaid: number
  currentPending: number
  children: React.ReactNode
}

export function RegisterPaymentDialog({
  orderId,
  orderTotal,
  currentPaid,
  currentPending,
  children
}: RegisterPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [loading, setLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      addNotification({ type: "error", message: "El monto debe ser mayor a 0" })
      return
    }

    if (paymentAmount > currentPending) {
      addNotification({ 
        type: "error", 
        message: `El monto no puede exceder lo pendiente (${formatCurrency(currentPending)})` 
      })
      return
    }

    setLoading(true)
    
    try {
      const result = await registerOrderPayment(orderId, paymentAmount)
      
      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        setOpen(false)
        setAmount("")
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al registrar pago" })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPayment = (percentage: number) => {
    const quickAmount = (currentPending * percentage / 100).toFixed(2)
    setAmount(quickAmount)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total del pedido:</span>
              <span className="font-semibold">{formatCurrency(orderTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ya pagado:</span>
              <span className="text-green-600">{formatCurrency(currentPaid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendiente:</span>
              <span className="text-red-600 font-semibold">{formatCurrency(currentPending)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Payment Buttons */}
            {currentPending > 0 && (
              <div className="space-y-2">
                <Label>Pago rápido</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPayment(25)}
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPayment(50)}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPayment(100)}
                  >
                    100%
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a pagar</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={currentPending}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500">
                Máximo: {formatCurrency(currentPending)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Pago"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}


