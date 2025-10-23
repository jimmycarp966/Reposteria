"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { format, addDays, addWeeks, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface MondayDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
}

export function MondayDatePicker({ value, onChange, placeholder = "Seleccionar lunes" }: MondayDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value + 'T00:00:00') : undefined
  )

  // Generar opciones de lunes para los próximos 3 meses
  const generateMondayOptions = () => {
    const options: { value: string; label: string }[] = []
    const today = new Date()
    const startDate = startOfWeek(today, { weekStartsOn: 1 })
    
    // Generar lunes para los próximos 12 semanas
    for (let i = 0; i < 12; i++) {
      const monday = addWeeks(startDate, i)
      if (monday >= today) {
        options.push({
          value: format(monday, 'yyyy-MM-dd'),
          label: format(monday, 'PPP', { locale: es })
        })
      }
    }
    
    return options
  }

  const mondayOptions = generateMondayOptions()

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    setSelectedDate(date)
    onChange(format(date, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-2">
      <Label>Fecha de inicio (Lunes)</Label>
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
        {mondayOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateChange(option.value)}
            className="justify-start text-left"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {option.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        📅 Selecciona un lunes para comenzar tu plan semanal
      </p>
    </div>
  )
}
