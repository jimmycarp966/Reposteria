"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy } from "lucide-react"
import { MondayDatePicker } from "./MondayDatePicker"
import { duplicateWeekPlan } from "@/actions/weeklyPlanActions"
import { useNotificationStore } from "@/store/notificationStore"
import { getNextWeekStart, formatDate } from "@/lib/utils"

interface DuplicatePlanDialogProps {
  sourceWeekStart: string
  onPlanDuplicated: (newWeekStartDate: string) => void
}

export function DuplicatePlanDialog({ sourceWeekStart, onPlanDuplicated }: DuplicatePlanDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [targetWeekStart, setTargetWeekStart] = useState(() => getNextWeekStart(sourceWeekStart))
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await duplicateWeekPlan(sourceWeekStart, targetWeekStart)
      
      if (result.success) {
        addNotification({ 
          type: "success", 
          message: `Plan duplicado exitosamente a la semana del ${formatDate(targetWeekStart)}` 
        })
        setOpen(false)
        onPlanDuplicated(targetWeekStart)
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al duplicar el plan semanal" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Duplicar Semana
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicar Plan Semanal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm">
              Semana de Origen: <span className="font-semibold">{formatDate(sourceWeekStart)}</span>
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="targetWeek" className="text-sm font-medium">
              Semana de Destino (Lunes)
            </label>
            <MondayDatePicker
              value={targetWeekStart}
              onChange={setTargetWeekStart}
              placeholder="Seleccionar lunes de destino"
            />
          </div>
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
              {loading ? "Duplicando..." : "Confirmar Duplicación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
