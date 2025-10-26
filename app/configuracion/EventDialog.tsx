"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventSchema } from "@/lib/validations"
import { z } from "zod"
import {
  Dialog,
  MobileDialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/mobile-dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { createEvent, updateEvent } from "@/actions/settingsActions"
import { useNotificationStore } from "@/store/notificationStore"

type FormData = z.infer<typeof eventSchema>

interface EventDialogProps {
  open: boolean
  onClose: () => void
  event?: any
  mode: "create" | "edit"
}

export function EventDialog({ open, onClose, event, mode }: EventDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split("T")[0],
      type: "EFEMERIDE",
      description: "",
    },
  })

  const eventType = watch("type")

  // Cargar datos del evento cuando esté en modo edición
  useEffect(() => {
    if (mode === "edit" && event && open) {
      reset({
        name: event.name || "",
        date: event.date || new Date().toISOString().split("T")[0],
        type: event.type || "EFEMERIDE",
        description: event.description || "",
      })
    } else if (mode === "create" && open) {
      reset({
        name: "",
        date: new Date().toISOString().split("T")[0],
        type: "EFEMERIDE",
        description: "",
      })
    }
  }, [event, mode, open, reset])

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      let result
      if (mode === "edit" && event) {
        result = await updateEvent(event.id, data)
      } else {
        result = await createEvent(data)
      }

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message!,
        })
        reset()
        onClose()
      } else {
        addNotification({
          type: "error",
          message: result.message!,
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error al guardar la efeméride",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {mode === "edit" ? "Editar Efeméride" : "Nueva Efeméride"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nombre *
            </Label>
            <Input
              id="name"
              className="h-11 text-base"
              placeholder="Ej: Día de la Madre"
              {...register("name")}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Fecha y Tipo */}
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Fecha *
              </Label>
              <Input
                id="date"
                type="date"
                className="h-11 text-base"
                {...register("date")}
                disabled={submitting}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Tipo *
              </Label>
              <Select
                value={eventType}
                onValueChange={(value) =>
                  setValue("type", value as "EFEMERIDE" | "REMINDER")
                }
                disabled={submitting}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFEMERIDE">Efeméride</SelectItem>
                  <SelectItem value="REMINDER">Recordatorio</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción
            </Label>
            <Textarea
              id="description"
              className="min-h-[100px] text-base resize-none"
              placeholder="Descripción opcional del evento"
              {...register("description")}
              disabled={submitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-[44px]"
            >
              {submitting
                ? "Guardando..."
                : mode === "edit"
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}
