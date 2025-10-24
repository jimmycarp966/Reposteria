"use client"

import { useState, useMemo } from "react"
import { Search, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Customer } from "@/lib/types"

interface CustomerSelectorProps {
  customers: Customer[]
  onSelect: (customer: Customer | null) => void
  onCreateNew?: () => void
  className?: string
}

export function CustomerSelector({ 
  customers, 
  onSelect, 
  onCreateNew,
  className 
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers.slice(0, 5) // Show only first 5 when no search

    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchQuery))
    )
  }, [customers, searchQuery])

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    onSelect(customer)
  }

  const handleNoCustomer = () => {
    setSelectedCustomer(null)
    onSelect(null)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* No customer option */}
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95",
          !selectedCustomer && "ring-2 ring-gray-400 bg-gray-50"
        )}
        onClick={handleNoCustomer}
      >
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-xs sm:text-sm">Venta sin cliente</h4>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Cliente anónimo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers list */}
      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95",
              selectedCustomer?.id === customer.id && "ring-2 ring-emerald-500 bg-emerald-50"
            )}
            onClick={() => handleCustomerSelect(customer)}
          >
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs sm:text-sm truncate">
                    {customer.name}
                  </h4>
                  {customer.email && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {customer.phone}
                    </p>
                  )}
                </div>
                {selectedCustomer?.id === customer.id && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">Seleccionado</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create new customer button */}
      {onCreateNew && (
        <Button
          variant="outline"
          className="w-full"
          onClick={onCreateNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Nuevo Cliente
        </Button>
      )}

      {filteredCustomers.length === 0 && searchQuery && (
        <div className="text-center py-4 text-muted-foreground">
          <p>No se encontraron clientes</p>
          {onCreateNew && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onCreateNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Cliente
            </Button>
          )}
        </div>
      )}
    </div>
  )
}



