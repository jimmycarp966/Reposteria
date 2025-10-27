"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getPurchaseHistory } from "@/actions/ingredientActions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { IngredientPurchase, Ingredient } from "@/lib/types"

interface PurchaseHistoryDialogProps {
  ingredient: Ingredient
  open: boolean
  onClose: () => void
}

export function PurchaseHistoryDialog({ ingredient, open, onClose }: PurchaseHistoryDialogProps) {
  const [purchases, setPurchases] = useState<IngredientPurchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPurchaseHistory()
    }
  }, [open, ingredient.id])

  const loadPurchaseHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPurchaseHistory(ingredient.id)
      if (result.success && result.data) {
        setPurchases(result.data)
      } else {
        setError(result.message || "Error al cargar historial")
      }
    } catch (err) {
      setError("Error al cargar historial de compras")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Historial de Compras - {ingredient.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay compras registradas para este ingrediente
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Compras</p>
                  <p className="text-2xl font-bold text-primary">{purchases.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Compra</p>
                  <p className="text-lg font-semibold">
                    {formatDate(purchases[0]?.purchase_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costo Actual</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(ingredient.cost_per_unit)}/{ingredient.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Total</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Proveedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {formatDate(purchase.purchase_date)}
                      </TableCell>
                      <TableCell>
                        {purchase.quantity_purchased} {purchase.unit_purchased}
                      </TableCell>
                      <TableCell>{formatCurrency(purchase.total_price)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(purchase.calculated_unit_cost)}/{ingredient.unit}
                      </TableCell>
                      <TableCell>{purchase.supplier || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
