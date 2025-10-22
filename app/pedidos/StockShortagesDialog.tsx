"use client"

/**
 * Diálogo para mostrar ingredientes faltantes cuando no hay stock suficiente
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { StockShortage } from "@/lib/types"

interface StockShortagesDialogProps {
  open: boolean
  onClose: () => void
  shortages: StockShortage[]
}

export function StockShortagesDialog({ open, onClose, shortages }: StockShortagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-600">Stock Insuficiente</DialogTitle>
              <DialogDescription>
                No hay suficientes ingredientes para este pedido
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm font-medium text-gray-700">
            Ingredientes faltantes:
          </p>
          {shortages.map((shortage) => (
            <div
              key={shortage.ingredient_id}
              className="p-3 rounded-lg bg-red-50 border border-red-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {shortage.ingredient_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requerido: {shortage.required_quantity.toFixed(2)} unidades
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Disponible: {shortage.available_quantity.toFixed(2)} unidades
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">
                    Falta: {shortage.shortage.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <div className="flex flex-col w-full gap-2">
            <Button onClick={onClose} variant="outline" className="w-full">
              Cerrar
            </Button>
            <Button 
              onClick={() => {
                onClose()
                window.location.href = '/ingredientes'
              }} 
              className="w-full btn-gradient-green"
            >
              Ir a Ingredientes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

