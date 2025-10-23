"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle2, AlertTriangle, PackageSearch } from "lucide-react"
import { checkStockForPlan } from "@/actions/weeklyPlanActions"
import { useNotificationStore } from "@/store/notificationStore"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface StockShortage {
  ingredient_name: string
  required_quantity: number
  available_quantity: number
  shortage: number
  unit: string
}

interface CheckStockDialogProps {
  planId: string
  planWeek: string
}

export function CheckStockDialog({ planId, planWeek }: CheckStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StockShortage[] | null>(null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleCheckStock = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await checkStockForPlan(planId)
      if (response.success) {
        setResult(response.data || [])
      } else {
        addNotification({ type: "error", message: response.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al verificar el stock" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackageSearch className="h-4 w-4 mr-2" />
          Verificar Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Verificación de Stock para la Semana</DialogTitle>
          <p className="text-sm text-muted-foreground">{planWeek}</p>
        </DialogHeader>
        
        {!result && (
          <div className="text-center py-8">
            <p className="mb-4">
              Esto analizará todas las tareas con recetas asociadas en el plan
              y las comparará con tu inventario actual.
            </p>
            <Button onClick={handleCheckStock} disabled={loading}>
              {loading ? "Verificando..." : "Iniciar Verificación"}
            </Button>
          </div>
        )}

        {result && result.length === 0 && (
          <div className="text-center py-8 text-green-600 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-12 w-12" />
            <p className="font-semibold text-lg">¡Todo en orden!</p>
            <p>Tienes stock suficiente de todos los ingredientes necesarios para completar este plan semanal.</p>
          </div>
        )}

        {result && result.length > 0 && (
          <div className="py-4">
            <div className="text-center py-4 text-amber-600 flex flex-col items-center gap-4 border-b mb-4">
                <AlertTriangle className="h-12 w-12" />
                <p className="font-semibold text-lg">¡Atención! Faltan ingredientes.</p>
                <p>Necesitarás reponer los siguientes ingredientes para completar tu plan:</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Faltante</TableHead>
                  <TableHead className="text-right">Requerido</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.map((item) => (
                  <TableRow key={item.ingredient_name}>
                    <TableCell className="font-medium">{item.ingredient_name}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {item.shortage} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.required_quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.available_quantity} {item.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
