"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, MobileDialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/mobile-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar } from "lucide-react"
import { MondayDatePicker } from "./MondayDatePicker"
import { createWeeklyPlan } from "@/actions/weeklyPlanActions"
import { useNotificationStore } from "@/store/notificationStore"
import { getCurrentWeekStart, getMondayOfWeek, formatDate } from "@/lib/utils"

interface CreatePlanDialogProps {
  onPlanCreated: (weekStartDate?: string) => void
}

export function CreatePlanDialog({ onPlanCreated }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStart())
  const [notes, setNotes] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar que la fecha sea lunes antes de enviar, usando UTC
    const testDate = new Date(weekStartDate + 'T00:00:00Z')
    if (testDate.getUTCDay() !== 1) { // 1 es Lunes en UTC
      addNotification({ 
        type: "error", 
        message: "La fecha seleccionada no es lunes. Por favor, selecciona un lunes." 
      })
      setLoading(false)
      return
    }

    try {
      const result = await createWeeklyPlan(weekStartDate, notes)
      
      if (result.success) {
        addNotification({ 
          type: "success", 
          message: `Plan semanal creado exitosamente para la semana del ${formatDate(weekStartDate)}` 
        })
        setOpen(false)
        setWeekStartDate(getCurrentWeekStart())
        setNotes("")
        // Recargar el plan para la semana que se acaba de crear
        onPlanCreated(weekStartDate)
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al crear plan semanal" })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setWeekStartDate(getCurrentWeekStart())
      setNotes("")
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-gradient-green">
          <Plus className="h-4 w-4 mr-2" />
          Crear Plan Semanal
        </Button>
      </DialogTrigger>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-5 w-5" />
            Crear Plan Semanal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="weekStartDate" className="text-sm font-medium">Fecha de inicio (Lunes)</Label>
            <MondayDatePicker
              value={weekStartDate}
              onChange={setWeekStartDate}
              placeholder="Seleccionar lunes de inicio"
            />
            <p className="text-xs text-muted-foreground">
              Los planes semanales siempre comienzan los lunes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar notas sobre el plan semanal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto h-11 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto h-11 text-base btn-gradient-green"
            >
              {loading ? "Creando..." : "Crear Plan"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}
