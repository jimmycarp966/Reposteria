"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Edit3, Package, X, Check } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import { useRouter } from "next/navigation"
import { getAvailableProductsForEvent, addProductToEvent, removeProductFromEvent, updateEventProductPrice, getEventProducts } from "@/actions/eventActions"
import type { EventWithProducts, Product, EventProductWithDetails } from "@/lib/types"

interface EventProductsDialogProps {
  event: EventWithProducts
  children: React.ReactNode
  onUpdate?: () => void
}

export function EventProductsDialog({ event, children, onUpdate }: EventProductsDialogProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [eventProducts, setEventProducts] = useState<EventProductWithDetails[]>(event.event_products || [])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [specialPrice, setSpecialPrice] = useState<string>("")
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const router = useRouter()

  const fetchEventProducts = async () => {
    try {
      const result = await getEventProducts(event.id)
      if (result.success) {
        setEventProducts(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching event products:", error)
    }
  }

  useEffect(() => {
    const fetchAvailableProducts = async () => {
      try {
        const result = await getAvailableProductsForEvent(event.id)
        if (result.success) {
          setAvailableProducts(result.data || [])
        }
      } catch (error) {
        console.error("Error fetching available products:", error)
      }
    }

    fetchAvailableProducts()
    fetchEventProducts()
  }, [event.id])

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      addNotification({
        type: "error",
        message: "Debes seleccionar un producto"
      })
      return
    }

    // Validar precio si se ingresó
    if (specialPrice) {
      const priceValue = parseFloat(specialPrice)
      if (isNaN(priceValue) || priceValue < 0) {
        addNotification({
          type: "error",
          message: "El precio debe ser un número válido mayor o igual a 0"
        })
        return
      }
    }

    setLoading(true)
    try {
      const price = specialPrice ? parseFloat(specialPrice) : undefined
      const result = await addProductToEvent(event.id, selectedProductId, price)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Producto agregado exitosamente"
        })
        
        // Reset form
        setSelectedProductId("")
        setSpecialPrice("")
        
        // Refresh both lists
        const [availableResult, eventProductsResult] = await Promise.all([
          getAvailableProductsForEvent(event.id),
          getEventProducts(event.id)
        ])
        
        if (availableResult.success) {
          setAvailableProducts(availableResult.data || [])
        }
        if (eventProductsResult.success) {
          setEventProducts(eventProductsResult.data || [])
        }
        
        // Notify parent to refresh
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al agregar producto"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al agregar producto"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveProduct = async (eventProductId: string) => {
    if (!confirm("¿Estás seguro de que quieres remover este producto de la efeméride?")) {
      return
    }

    setLoading(true)
    try {
      const result = await removeProductFromEvent(eventProductId)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Producto removido exitosamente"
        })
        
        // Refresh both lists
        const [availableResult, eventProductsResult] = await Promise.all([
          getAvailableProductsForEvent(event.id),
          getEventProducts(event.id)
        ])
        
        if (availableResult.success) {
          setAvailableProducts(availableResult.data || [])
        }
        if (eventProductsResult.success) {
          setEventProducts(eventProductsResult.data || [])
        }
        
        // Notify parent to refresh
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al remover producto"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al remover producto"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrice = async (eventProductId: string) => {
    const priceValue = parseFloat(newPrice)
    if (isNaN(priceValue) || priceValue < 0) {
      addNotification({
        type: "error",
        message: "El precio debe ser un número válido mayor o igual a 0"
      })
      return
    }

    setLoading(true)
    try {
      const result = await updateEventProductPrice(eventProductId, priceValue)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Precio actualizado exitosamente"
        })
        setEditingPrice(null)
        setNewPrice("")
        
        // Refresh event products
        const eventProductsResult = await getEventProducts(event.id)
        if (eventProductsResult.success) {
          setEventProducts(eventProductsResult.data || [])
        }
        
        // Notify parent to refresh
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al actualizar precio"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al actualizar precio"
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditingPrice = (eventProduct: EventProductWithDetails) => {
    setEditingPrice(eventProduct.id)
    setNewPrice(eventProduct.special_price?.toString() || "")
  }

  const cancelEditingPrice = () => {
    setEditingPrice(null)
    setNewPrice("")
  }

  const selectedProduct = availableProducts.find(p => p.id === selectedProductId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-5 w-5" />
            <span className="truncate">Productos para {event.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Current products */}
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-3">Productos Asociados</h3>
            {eventProducts && eventProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {eventProducts.map(eventProduct => (
                  <Card key={eventProduct.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {eventProduct.product.image_url ? (
                            <img
                              src={eventProduct.product.image_url}
                              alt={eventProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-lg">📦</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <h4 className="font-medium text-sm sm:text-base truncate">
                            {eventProduct.product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            SKU: {eventProduct.product.sku || 'N/A'}
                          </p>
                        </div>

                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end">
                          {editingPrice === eventProduct.id ? (
                            <div className="flex items-center gap-2 flex-1 sm:flex-none">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full sm:w-24 h-10 sm:h-9 text-sm"
                                placeholder="0.00"
                                disabled={loading}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePrice(eventProduct.id)}
                                className="h-10 w-10 sm:h-9 sm:w-9 p-0 shrink-0"
                                disabled={loading}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditingPrice}
                                className="h-10 w-10 sm:h-9 sm:w-9 p-0 shrink-0"
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1 text-right">
                              <p className="text-sm sm:text-base font-medium">
                                ${eventProduct.special_price?.toFixed(2) || eventProduct.product.suggested_price_cache?.toFixed(2) || '0.00'}
                              </p>
                              {eventProduct.special_price && eventProduct.special_price !== eventProduct.product.suggested_price_cache && (
                                <p className="text-xs text-muted-foreground">
                                  Normal: ${eventProduct.product.suggested_price_cache?.toFixed(2) || '0.00'}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 shrink-0">
                            {editingPrice !== eventProduct.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingPrice(eventProduct)}
                                className="h-10 w-10 sm:h-9 sm:w-9 p-0"
                                disabled={loading}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveProduct(eventProduct.id)}
                              className="h-10 w-10 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {eventProduct.special_price && eventProduct.special_price !== eventProduct.product.suggested_price_cache && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Precio Especial
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay productos asociados a esta efeméride</p>
              </div>
            )}
          </div>

          {/* Add new product */}
          {availableProducts.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-3">Agregar Producto</h3>
              <div className="border rounded-lg p-3 sm:p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Producto</label>
                    <Select
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full h-10 sm:h-9">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.suggested_price_cache?.toFixed(2) || '0.00'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Precio Especial (opcional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={selectedProduct ? `Precio normal: $${selectedProduct.suggested_price_cache?.toFixed(2) || '0.00'}` : "0.00"}
                      value={specialPrice}
                      onChange={(e) => setSpecialPrice(e.target.value)}
                      className="h-10 sm:h-9"
                      disabled={loading}
                    />
                  </div>
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        📦
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Precio normal: ${selectedProduct.suggested_price_cache?.toFixed(2) || '0.00'}
                          {specialPrice && !isNaN(parseFloat(specialPrice)) && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              Precio especial: ${parseFloat(specialPrice).toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAddProduct} 
                  className="w-full h-11 sm:h-10"
                  disabled={loading || !selectedProductId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Agregando..." : "Agregar Producto"}
                </Button>
              </div>
            </div>
          )}

          {availableProducts.length === 0 && eventProducts.length > 0 && (
            <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                Todos los productos ya están asociados a esta efeméride
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}






