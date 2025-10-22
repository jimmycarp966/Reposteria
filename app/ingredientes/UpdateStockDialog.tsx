"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inventoryUpdateSchema } from "@/lib/validations"
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
import { updateStock } from "@/actions/inventoryActions"
import { useNotificationStore } from "@/store/notificationStore"

interface UpdateStockDialogProps {
  open: boolean
  onClose: () => void
  ingredient: any
}

type FormData = {
  quantity: number
  type: "IN" | "OUT"
  notes?: string
}

export function UpdateStockDialog({ open, onClose, ingredient }: UpdateStockDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState<"IN" | "OUT">("IN")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      type: "IN",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      const result = await updateStock({
        ingredient_id: ingredient.id,
        quantity: data.quantity,
        type: type,
        notes: data.notes,
      })

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
        onClose()
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const currentStock = ingredient.inventory?.quantity || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Stock - {ingredient.name}</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">Stock actual</p>
          <p className="text-2xl font-bold">
            {currentStock} {ingredient.unit}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Movimiento *</Label>
            <Select value={type} onValueChange={(value) => setType(value as "IN" | "OUT")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Entrada (Agregar)</SelectItem>
                <SelectItem value="OUT">Salida (Quitar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" {...register("notes")} placeholder="Ej: Compra a proveedor" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Actualizando..." : "Actualizar Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



