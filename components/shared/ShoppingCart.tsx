"use client"

import { useState } from "react"
import { Plus, Minus, Trash2, ShoppingCart as CartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export interface CartItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
}

interface ShoppingCartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onUpdatePrice?: (productId: string, price: number) => void
  allowPriceEdit?: boolean
  className?: string
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdatePrice,
  allowPriceEdit = false,
  className
}: ShoppingCartProps) {
  const [editingPrices, setEditingPrices] = useState<Record<string, boolean>>({})

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId)
    } else {
      onUpdateQuantity(productId, newQuantity)
    }
  }

  const handlePriceEdit = (productId: string, newPrice: number) => {
    if (onUpdatePrice) {
      onUpdatePrice(productId, newPrice)
    }
    setEditingPrices(prev => ({ ...prev, [productId]: false }))
  }

  const startPriceEdit = (productId: string) => {
    setEditingPrices(prev => ({ ...prev, [productId]: true }))
  }

  if (items.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-8 text-center">
          <CartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">El carrito está vacío</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega productos para comenzar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <CartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Carrito de Compras</span>
          </div>
          <Badge variant="secondary" className="w-fit text-xs">{items.length} producto(s)</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Items list */}
        <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                {/* Product image */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">📦</div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm truncate">
                    {item.product.name}
                  </h4>
                  {item.product.sku && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      SKU: {item.product.sku}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                {/* Quantity controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <span className="text-xs sm:text-sm font-medium min-w-[1.5rem] sm:min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                {/* Price */}
                <div className="text-right min-w-[60px] sm:min-w-[80px]">
                  {editingPrices[item.id] ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={item.unitPrice}
                      className="h-7 sm:h-8 w-16 sm:w-20 text-xs sm:text-sm"
                      onBlur={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0
                        handlePriceEdit(item.id, newPrice)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newPrice = parseFloat(e.currentTarget.value) || 0
                          handlePriceEdit(item.id, newPrice)
                        }
                        if (e.key === 'Escape') {
                          setEditingPrices(prev => ({ ...prev, [item.id]: false }))
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="space-y-0.5">
                      <p 
                        className={cn(
                          "text-xs sm:text-sm font-medium",
                          allowPriceEdit && "cursor-pointer hover:text-emerald-600"
                        )}
                        onClick={() => allowPriceEdit && startPriceEdit(item.id)}
                      >
                        ${item.unitPrice.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-600">
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-3 sm:pt-4">
          <div className="flex justify-between items-center text-base sm:text-lg font-semibold">
            <span>Total:</span>
            <span className="text-emerald-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



