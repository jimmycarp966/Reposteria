"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteRecipe } from "@/actions/recipeActions"
import { useNotificationStore } from "@/store/notificationStore"
import { Copy, Edit, Trash2 } from "lucide-react"
import { EditRecipeDialog } from "../EditRecipeDialog"

interface RecipeActionsProps {
  recipeId: string
  recipe: any
  ingredients: any[]
}

export function RecipeActions({ recipeId, recipe, ingredients }: RecipeActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDuplicate = () => {
    // TODO: Implementar duplicar receta
    addNotification({ 
      type: "info", 
      message: "Función de duplicar receta próximamente" 
    })
  }

  const handleEdit = () => {
    // Edit functionality is now handled by EditRecipeDialog
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setIsDeleting(true)
      const result = await deleteRecipe(recipeId)
      
      if (result.success) {
        addNotification({ 
          type: "success", 
          message: "Receta eliminada exitosamente" 
        })
        router.push("/recetas")
      } else {
        addNotification({ 
          type: "error", 
          message: result.message || "Error al eliminar la receta" 
        })
      }
    } catch (error) {
      addNotification({ 
        type: "error", 
        message: "Error inesperado al eliminar la receta" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button 
        className="w-full" 
        variant="outline"
        onClick={handleDuplicate}
      >
        <Copy className="h-4 w-4 mr-2" />
        Duplicar Receta
      </Button>
      
            <EditRecipeDialog 
              recipe={recipe} 
              ingredients={ingredients} 
            />
      
      <Button 
        className="w-full" 
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? "Eliminando..." : "Eliminar Receta"}
      </Button>
    </div>
  )
}
