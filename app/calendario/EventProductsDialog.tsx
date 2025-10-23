"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit3, Package } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import { getAvailableProductsForEvent, addProductToEvent, removeProductFromEvent, updateEventProductPrice } from "@/actions/eventActions"
import { getProducts } from "@/actions/productActions"
import type { EventWithProducts, Product, EventProductWithDetails } from "@/lib/types"

interface EventProductsDialogProps {
  event: EventWithProducts
  children: React.ReactNode
}

export function EventProductsDialog({ event, children }: EventProductsDialogProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [specialPrice, setSpecialPrice] = useState<string>("")
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<string>("")
  const addNotification = useNotificationStore((state) => state.addNotification)

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
  }, [event.id])

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      addNotification({
        type: "error",
        message: "Debes seleccionar un producto"
      })
      return
    }

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
        
        // Refresh available products
        const availableResult = await getAvailableProductsForEvent(event.id)
        if (availableResult.success) {
          setAvailableProducts(availableResult.data || [])
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
    }
  }

  const handleRemoveProduct = async (eventProductId: string) => {
    try {
      const result = await removeProductFromEvent(eventProductId)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Producto removido exitosamente"
        })
        
        // Refresh available products
        const availableResult = await getAvailableProductsForEvent(event.id)
        if (availableResult.success) {
          setAvailableProducts(availableResult.data || [])
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
    }
  }

  const handleUpdatePrice = async (eventProductId: string) => {
    try {
      const price = parseFloat(newPrice) || 0
      const result = await updateEventProductPrice(eventProductId, price)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Precio actualizado exitosamente"
        })
        setEditingPrice(null)
        setNewPrice("")
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
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos para {event.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current products */}
          <div>
            <h3 className="text-lg font-medium mb-3">Productos Asociados</h3>
            {event.event_products && event.event_products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.event_products.map(eventProduct => (
                  <Card key={eventProduct.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {eventProduct.product.image_url ? (
                            <img
                              src={eventProduct.product.image_url}
                              alt={eventProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">📦</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {eventProduct.product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            SKU: {eventProduct.product.sku || 'N/A'}
                          </p>
                        </div>

                        <div className="text-right">
                          {editingPrice === eventProduct.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-20 h-8 text-sm"
                                placeholder="0.00"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdatePrice(eventProduct.id)}
                                className="h-8 px-2"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditingPrice}
                                className="h-8 px-2"
                              >
                                ✗
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                ${eventProduct.special_price?.toFixed(2) || eventProduct.product.suggested_price_cache?.toFixed(2) || '0.00'}
                              </p>
                              {eventProduct.special_price && eventProduct.special_price !== eventProduct.product.suggested_price_cache && (
                                <p className="text-xs text-muted-foreground">
                                  Normal: ${eventProduct.product.suggested_price_cache?.toFixed(2) || '0.00'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {editingPrice !== eventProduct.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingPrice(eventProduct)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProduct(eventProduct.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              <h3 className="text-lg font-medium mb-3">Agregar Producto</h3>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Producto</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecciona un producto</option>
                      {availableProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.suggested_price_cache?.toFixed(2) || '0.00'}
                        </option>
                      ))}
                    </select>
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
                    />
                  </div>
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        📦
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Precio normal: ${selectedProduct.suggested_price_cache?.toFixed(2) || '0.00'}
                          {specialPrice && (
                            <span className="ml-2 text-emerald-600">
                              Precio especial: ${parseFloat(specialPrice).toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleAddProduct} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </div>
          )}

          {availableProducts.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Todos los productos ya están asociados a esta efeméride</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


