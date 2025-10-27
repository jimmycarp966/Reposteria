"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  MoreVertical, 
  Package, 
  ShoppingCart, 
  History, 
  BarChart3, 
  Trash2 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface IngredientActionSheetProps {
  ingredient: any
  onStockClick: () => void
  onPurchaseClick: () => void
  onHistoryClick: () => void
  onPriceHistoryClick: () => void
  onDeleteClick: () => void
}

export function IngredientActionSheet({
  ingredient,
  onStockClick,
  onPurchaseClick,
  onHistoryClick,
  onPriceHistoryClick,
  onDeleteClick
}: IngredientActionSheetProps) {
  const [open, setOpen] = useState(false)

  const actions = [
    {
      id: "stock",
      label: "Actualizar Stock",
      description: "Modificar cantidad disponible",
      icon: Package,
      onClick: () => {
        onStockClick()
        setOpen(false)
      },
      variant: "default" as const
    },
    {
      id: "purchase",
      label: "Registrar Compra",
      description: "Agregar nueva compra",
      icon: ShoppingCart,
      onClick: () => {
        onPurchaseClick()
        setOpen(false)
      },
      variant: "default" as const
    },
    {
      id: "history",
      label: "Historial de Compras",
      description: "Ver compras anteriores",
      icon: History,
      onClick: () => {
        onHistoryClick()
        setOpen(false)
      },
      variant: "default" as const
    },
    {
      id: "prices",
      label: "Historial de Precios",
      description: "Ver evolución de precios",
      icon: BarChart3,
      onClick: () => {
        onPriceHistoryClick()
        setOpen(false)
      },
      variant: "default" as const
    },
    {
      id: "delete",
      label: "Eliminar Ingrediente",
      description: "Borrar permanentemente",
      icon: Trash2,
      onClick: () => {
        onDeleteClick()
        setOpen(false)
      },
      variant: "destructive" as const
    }
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label="Más acciones"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto max-h-[85vh] p-0">
        <div className="flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">
              {ingredient.name}
            </SheetTitle>
            <p className="text-sm text-muted-foreground text-left">
              Selecciona una acción
            </p>
          </SheetHeader>

          {/* Actions List */}
          <div className="px-6 py-4 space-y-2">
            {actions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.id}
                  variant={action.variant === "destructive" ? "destructive" : "ghost"}
                  className={cn(
                    "w-full justify-start h-14 px-4 text-left",
                    action.variant === "destructive" 
                      ? "hover:bg-red-50 hover:text-red-700" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={action.onClick}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      action.variant === "destructive" 
                        ? "bg-red-100 text-red-600" 
                        : "bg-primary/10 text-primary"
                    )}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">
                        {action.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>

          {/* Cancel Button */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
