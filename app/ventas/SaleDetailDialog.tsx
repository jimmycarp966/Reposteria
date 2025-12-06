"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, CreditCard, FileText, Package, Edit2, Check, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CustomerSelector } from "@/components/shared/CustomerSelector"
import { CreateCustomerDialog } from "./CreateCustomerDialog"
import { useNotificationStore } from "@/store/notificationStore"
import { updateSaleCustomer } from "@/actions/saleActions"
import { getCustomers } from "@/actions/customerActions"
import type { SaleWithItems, Customer } from "@/lib/types"

interface SaleDetailDialogProps {
  sale: SaleWithItems
  children: React.ReactNode
}

export function SaleDetailDialog({ sale, children }: SaleDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(sale.customer || null)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [loading, setLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleEditClick = async () => {
    setIsEditing(true)
    // Load customers if not already loaded
    if (customers.length === 0) {
      try {
        const result = await getCustomers()
        if (result.success) {
          setCustomers(result.data || [])
        }
      } catch (error) {
        addNotification({
          type: "error",
          message: "Error al cargar clientes"
        })
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedCustomer(sale.customer || null)
  }

  const handleSaveCustomer = async () => {
    setLoading(true)
    try {
      const result = await updateSaleCustomer(sale.id, selectedCustomer?.id || null)

      if (result.success) {
        addNotification({
          type: "success",
          message: result.message!
        })
        setIsEditing(false)
        // Update the sale object with the new customer
        sale.customer = selectedCustomer || undefined
      } else {
        addNotification({
          type: "error",
          message: result.message!
        })
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error al actualizar cliente"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
  }

  const handleCreateCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer])
    setSelectedCustomer(customer)
    setShowCreateCustomer(false)
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detalle de Venta</DialogTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Cliente
                </Button>
              )}
            </div>
          </DialogHeader>

        <div className="space-y-6">
          {/* Sale Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {formatDate(sale.sale_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">
                    {new Date(sale.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  {isEditing ? (
                    <CustomerSelector
                      customers={customers}
                      onSelect={handleCustomerSelect}
                      onCreateNew={() => setShowCreateCustomer(true)}
                      className="mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <p className="font-medium">
                        {sale.customer?.name || "Sin cliente"}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <Badge variant="outline" className="capitalize">
                      {sale.payment_method}
                    </Badge>
                  </div>
                </div>
              </div>

              {sale.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5" />
                    <p className="text-sm">{sale.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sale.sale_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
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
                      <h4 className="font-medium text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Cantidad: {item.quantity}
                      </p>
                    </div>

                    {/* Price info */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        ${item.unit_price.toFixed(2)} c/u
                      </p>
                      <p className="text-sm font-semibold text-emerald-600">
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total de la Venta:</span>
                <span className="text-emerald-600">
                  ${sale.total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCustomer}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Customer Dialog */}
    <CreateCustomerDialog
      open={showCreateCustomer}
      onOpenChange={setShowCreateCustomer}
      onCustomerCreated={handleCreateCustomer}
    />
    </>
  )
}






