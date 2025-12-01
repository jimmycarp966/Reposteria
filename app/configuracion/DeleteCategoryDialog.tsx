"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteTaskCategory } from "@/actions/categoryActions"
import { useNotificationStore } from "@/store/notificationStore"
import { AlertTriangle } from "lucide-react"

interface DeleteCategoryDialogProps {
  open: boolean
  onClose: () => void
  category: any
}

export function DeleteCategoryDialog({
  open,
  onClose,
  category,
}: DeleteCategoryDialogProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDelete = async () => {
    try {
      setSubmitting(true)

      const result = await deleteTaskCategory(category.id)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message!,
        })
        onClose()
        // Refrescar los datos del servidor
        router.refresh()
      } else {
        addNotification({
          type: "error",
          message: result.message!,
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error al eliminar la categoría",
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
            Eliminar Categoría
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no
            se puede deshacer. Las tareas que usen esta categoría quedarán sin categoría asignada.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-6 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: category?.color || "#808080" }}
            />
            <p className="font-medium">{category?.name}</p>
          </div>
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

