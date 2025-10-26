"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteEvent } from "@/actions/settingsActions"
import { useNotificationStore } from "@/store/notificationStore"
import { AlertTriangle } from "lucide-react"

interface DeleteEventDialogProps {
  open: boolean
  onClose: () => void
  event: any
}

export function DeleteEventDialog({
  open,
  onClose,
  event,
}: DeleteEventDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDelete = async () => {
    try {
      setSubmitting(true)

      const result = await deleteEvent(event.id)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message!,
        })
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
        message: "Error al eliminar la efeméride",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Eliminar Efeméride
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta efeméride? Esta acción no
            se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-4">
          <p className="font-medium">{event?.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {event?.date} - {event?.type}
          </p>
        </div>

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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
            className="min-h-[44px]"
          >
            {submitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
