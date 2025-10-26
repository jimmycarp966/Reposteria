"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { orderSchema } from "@/lib/validations"
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
import { createOrder } from "@/actions/orderActions"
import { getProducts } from "@/actions/productActions"
import { getEvents } from "@/actions/settingsActions"
import { useNotificationStore } from "@/store/notificationStore"
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { formatCurrency, get_current_date } from "@/lib/utils"
import { addMinutes } from "date-fns"

interface CreateOrderDialogProps {
  open: boolean
  onClose: () => void
}

type FormData = z.infer<typeof orderSchema>

export function CreateOrderDialog({ open, onClose }: CreateOrderDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [orderType, setOrderType] = useState<"DAILY" | "EFEMERIDE">("DAILY")
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      type: "DAILY",
      delivery_date: get_current_date().toISOString().split("T")[0],
      items: [{ 
        product_id: "", 
        quantity: 1, 
        unit_price: 0, 
        cost_at_sale: 0,
        production_time_estimate_minutes: 60 
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const watchedItems = watch("items")

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    const [productsResult, eventsResult] = await Promise.all([
      getProducts(),
      getEvents(),
    ])

    if (productsResult.success) {
      setProducts(productsResult.data || [])
    }
    if (eventsResult.success) {
      setEvents(eventsResult.data || [])
    }
  }

  // Calculate totals
  const totals = watchedItems.reduce((acc, item) => {
    const qty = item.quantity || 0
    const price = item.unit_price || 0
    const cost = item.cost_at_sale || 0
    const time = item.production_time_estimate_minutes || 0

    return {
      totalCost: acc.totalCost + (cost * qty),
      totalPrice: acc.totalPrice + (price * qty),
      totalTime: acc.totalTime + (time * qty),
    }
  }, { totalCost: 0, totalPrice: 0, totalTime: 0 })

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      const result = await createOrder(data)

      if (result.success) {
        addNotification({ type: "success", message: result.message! })
        reset()
        onClose()
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      console.log('💥 Error in onSubmit:', error)
      addNotification({ type: "error", message: "Error inesperado al crear pedido" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${index}.product_id`, productId)
      setValue(`items.${index}.unit_price`, product.suggested_price_cache)
      setValue(`items.${index}.cost_at_sale`, product.base_cost_cache)
      setValue(`items.${index}.production_time_estimate_minutes`, 60)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Nuevo Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Order Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Pedido *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={orderType === "DAILY" ? "default" : "outline"}
                onClick={() => {
                  setOrderType("DAILY")
                  setValue("type", "DAILY")
                }}
                className="flex-1 h-11 text-base"
              >
                Pedido Diario
              </Button>
              <Button
                type="button"
                variant={orderType === "EFEMERIDE" ? "default" : "outline"}
                onClick={() => {
                  setOrderType("EFEMERIDE")
                  setValue("type", "EFEMERIDE")
                }}
                className="flex-1 h-11 text-base"
              >
                Por Efeméride
              </Button>
            </div>
          </div>

          {/* Delivery Date and Time */}
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="space-y-2">
              <Label htmlFor="delivery_date" className="text-sm font-medium">Fecha de Entrega *</Label>
              <Input
                id="delivery_date"
                type="date"
                className="h-11 text-base"
                {...register("delivery_date")}
              />
              {errors.delivery_date && (
                <p className="text-sm text-red-600">{errors.delivery_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_time" className="text-sm font-medium">Hora de Entrega</Label>
              <Input
                id="delivery_time"
                type="time"
                className="h-11 text-base"
                {...register("delivery_time")}
              />
            </div>
          </div>

          {/* Event Selection for EFEMERIDE */}
          {orderType === "EFEMERIDE" && events.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Efeméride Relacionada</Label>
              <Select>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Seleccionar efeméride (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} - {event.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Customer Name - Optional */}
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="space-y-2">
              <Label htmlFor="customer_name" className="text-sm font-medium">Nombre del Cliente (opcional)</Label>
              <Input
                id="customer_name"
                className="h-11 text-base"
                {...register("customer_name")}
                placeholder="Ej: María González"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone" className="text-sm font-medium">Teléfono (opcional)</Label>
              <Input
                id="customer_phone"
                type="tel"
                className="h-11 text-base"
                {...register("customer_phone")}
                placeholder="Ej: 11 2345-6789"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notas / Detalles Adicionales</Label>
            <Input
              id="notes"
              className="h-11 text-base"
              {...register("notes")}
              placeholder="Ej: Decoración especial, bandeja incluida, alérgenos..."
            />
          </div>

          {/* Order Items */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Label className="text-base font-semibold">Productos *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ 
                  product_id: "", 
                  quantity: 1, 
                  unit_price: 0, 
                  cost_at_sale: 0,
                  production_time_estimate_minutes: 60 
                })}
                className="w-full sm:w-auto h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-card">
                  {/* Desktop Layout */}
                  <div className="hidden lg:flex gap-2 items-start">
                    <div className="flex-1">
                      <Select
                        value={field.product_id}
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.suggested_price_cache)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Cant."
                        min="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                      />
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Producto</Label>
                      <Select
                        value={field.product_id}
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.suggested_price_cache)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cantidad</Label>
                        <Input
                          type="number"
                          placeholder="Ej: 2"
                          min="1"
                          className="h-11 text-base"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Precio Unitario</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 1500.00"
                          className="h-11 text-base"
                          {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Subtotal: </span>
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency((field.quantity || 0) * (field.unit_price || 0))}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.items && (
              <p className="text-sm text-red-600 mt-2">{errors.items.message}</p>
            )}
          </div>

          {/* Totals Summary */}
          <div className="border-t pt-6 space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo Total:</span>
                  <span className="font-semibold">{formatCurrency(totals.totalCost)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-medium">Precio Total:</span>
                  <span className="font-bold text-xl">{formatCurrency(totals.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ganancia:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(totals.totalPrice - totals.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo Estimado Producción:</span>
                  <span className="font-semibold">{totals.totalTime} minutos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto h-11 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full sm:w-auto h-11 text-base"
              onClick={() => console.log('🔘 CreateOrder button clicked!')}
            >
              {submitting ? "Creando..." : "Crear Pedido"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}

