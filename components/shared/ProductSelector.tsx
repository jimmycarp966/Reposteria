"use client"

import { useState, useMemo } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface ProductSelectorProps {
  products: Product[]
  onSelect: (product: Product) => void
  highlightedProducts?: string[] // Array of product IDs to highlight
  showPrice?: boolean
  className?: string
}

export function ProductSelector({ 
  products, 
  onSelect, 
  highlightedProducts = [], 
  showPrice = true,
  className 
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products

    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [products, searchQuery])

  const handleProductSelect = (product: Product) => {
    onSelect(product)
    setSearchQuery("") // Clear search after selection
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {filteredProducts.map((product) => {
          const isHighlighted = highlightedProducts.includes(product.id)
          
          return (
            <Card
              key={product.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105",
                isHighlighted && "ring-2 ring-emerald-500 bg-emerald-50"
              )}
              onClick={() => handleProductSelect(product)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {product.name}
                    </h4>
                    
                    {product.sku && (
                      <p className="text-xs text-muted-foreground truncate">
                        SKU: {product.sku}
                      </p>
                    )}

                    {showPrice && (
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        ${product.suggested_price_cache?.toFixed(2) || '0.00'}
                      </p>
                    )}

                    {isHighlighted && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Destacado
                      </Badge>
                    )}
                  </div>

                  {/* Add button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProductSelect(product)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}


