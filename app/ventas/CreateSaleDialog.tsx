"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ProductSelector } from "@/components/shared/ProductSelector"
import { CustomerSelector } from "@/components/shared/CustomerSelector"
import { ShoppingCart, type CartItem } from "@/components/shared/ShoppingCart"
import { CreateCustomerDialog } from "./CreateCustomerDialog"
import { useNotificationStore } from "@/store/notificationStore"
import { createSale } from "@/actions/saleActions"
import { getProducts } from "@/actions/productActions"
import { getCustomers } from "@/actions/customerActions"
import { getTodaysEventsWithProducts } from "@/actions/eventActions"
import { saleSchema } from "@/lib/validations"
import { formatDate } from "@/lib/utils"
import type { Product, Customer, EventWithProducts } from "@/lib/types"

interface CreateSaleDialogProps {
  children: React.ReactNode
}

export function CreateSaleDialog({ children }: CreateSaleDialogProps) {
  const [open, setOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const form = useForm({
    resolver: zodResolver(saleSchema.omit({ items: true })),
    defaultValues: {
      sale_date: new Date().toISOString().split('T')[0],
      customer_id: "",
      payment_method: "efectivo" as const,
      notes: ""
    }
  })

  // State for data
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [todaysEvents, setTodaysEvents] = useState<EventWithProducts[]>([])

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResult, customersResult, eventsResult] = await Promise.all([
          getProducts(),
          getCustomers(),
          getTodaysEventsWithProducts()
        ])

        if (productsResult.success) {
          setProducts(productsResult.data || [])
        }
        if (customersResult.success) {
          setCustomers(customersResult.data || [])
        }
        if (eventsResult.success) {
          setTodaysEvents(eventsResult.data || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  // Get highlighted products from today's events
  const highlightedProducts = todaysEvents.flatMap(event => 
    event.event_products?.map(ep => ep.product_id) || []
  )

  const handleAddToCart = useCallback((product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id)
    
    if (existingItem) {
      setCartItems(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      const newItem: CartItem = {
        id: product.id,
        product,
        quantity: 1,
        unitPrice: product.suggested_price_cache || 0,
        subtotal: product.suggested_price_cache || 0
      }
      setCartItems(prev => [...prev, newItem])
    }
  }, [cartItems])

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, quantity, subtotal: quantity * item.unitPrice }
        : item
    ))
  }, [])

  const handleUpdatePrice = useCallback((productId: string, price: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, unitPrice: price, subtotal: item.quantity * price }
        : item
    ))
  }, [])

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId))
  }, [])

  const handleCustomerSelect = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer)
    form.setValue("customer_id", customer?.id || "")
  }, [form])

  const handleCustomerCreated = useCallback((newCustomer: Customer) => {
    setSelectedCustomer(newCustomer)
    form.setValue("customer_id", newCustomer.id)
    setShowCustomerDialog(false)
    addNotification({
      type: "success",
      message: "Cliente creado exitosamente"
    })
  }, [form, addNotification])

  const onSubmit = async (data: any) => {
    
    if (cartItems.length === 0) {
      console.log('❌ No items in cart')
      addNotification({
        type: "error",
        message: "Debes agregar al menos un producto al carrito"
      })
      return
    }

    try {
      const saleData = {
        sale_date: data.sale_date,
        payment_method: data.payment_method,
        notes: data.notes,
        ...(data.customer_id && { customer_id: data.customer_id }), // Solo incluir customer_id si no está vacío
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      }

      const result = await createSale(saleData)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message || "Venta creada exitosamente"
        })
        
        // Reset form and cart
        form.reset()
        setCartItems([])
        setSelectedCustomer(null)
        setOpen(false)
      } else {
        addNotification({
          type: "error",
          message: result.message || "Error al crear venta"
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error inesperado al crear venta"
      })
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Nueva Venta</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left side - Products and Cart */}
            <div className="space-y-3 sm:space-y-4">
              {/* Today's events notice */}
              {todaysEvents.length > 0 && (
                <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                  <h4 className="font-medium text-emerald-700 mb-1 sm:mb-2 text-xs sm:text-sm">
                    🎉 Efemérides de Hoy
                  </h4>
                  <div className="space-y-0.5 sm:space-y-1">
                    {todaysEvents.map(event => (
                      <div key={event.id} className="text-xs sm:text-sm">
                        <span className="font-medium">{event.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({event.event_products?.length || 0} productos especiales)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Selector */}
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Seleccionar Productos</h3>
                <ProductSelector
                  products={products}
                  onSelect={handleAddToCart}
                  highlightedProducts={highlightedProducts}
                  showPrice={true}
                />
              </div>

              {/* Shopping Cart */}
              <div>
                <ShoppingCart
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdatePrice={handleUpdatePrice}
                  onRemoveItem={handleRemoveItem}
                  allowPriceEdit={true}
                />
              </div>
            </div>

            {/* Right side - Form */}
            <div className="space-y-3 sm:space-y-4">
              <Form {...form}>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = form.getValues()
                  await onSubmit(formData)
                }} className="space-y-3 sm:space-y-4">
                  {/* Customer Selector */}
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Cliente</h3>
                    <CustomerSelector
                      customers={customers}
                      onSelect={handleCustomerSelect}
                      onCreateNew={() => setShowCustomerDialog(true)}
                    />
                    {selectedCustomer && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium">Cliente seleccionado:</p>
                        <p className="text-xs sm:text-sm">{selectedCustomer.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona método de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre la venta..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total and Submit */}
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                    <div className="flex justify-between items-center text-base sm:text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-emerald-600">${total.toFixed(2)}</span>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 sm:h-10"
                      disabled={cartItems.length === 0}
                    >
                      Registrar Venta
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateCustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  )
}
