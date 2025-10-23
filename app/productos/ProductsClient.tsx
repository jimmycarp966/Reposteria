"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateProductDialog } from "./CreateProductDialog"
import { EditPriceDialog } from "./EditPriceDialog"
import { deleteProduct, getProducts } from "@/actions/productActions"
import { useNotificationStore } from "@/store/notificationStore"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, Edit, Package } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { DataTable } from "@/components/shared/DataTable"
import { SearchFilter } from "@/components/shared/SearchFilter"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { Badge } from "@/components/ui/badge"
import type { ProductWithRecipe, Recipe, Column } from "@/lib/types"

interface ProductsClientProps {
  initialProducts: ProductWithRecipe[]
  recipes: Recipe[]
  initialPagination?: {
    page: number
    pageSize: number
    total: number
  }
}

export function ProductsClient({ initialProducts, recipes, initialPagination }: ProductsClientProps) {
  const [products, setProducts] = useState<ProductWithRecipe[]>(initialProducts)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditPriceDialog, setShowEditPriceDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRecipe | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    search,
    debouncedSearch,
    setSearch,
    clearSearch,
    isSearching
  } = useSearchFilter({
    onSearchChange: (term) => {
      // En una implementación real, aquí se haría fetch con el término de búsqueda
      console.log('Searching for:', term)
    }
  })

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    const result = await deleteProduct(id)
    if (result.success) {
      addNotification({ type: "success", message: "Producto eliminado" })
      setProducts(prev => prev.filter(p => p.id !== id))
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  const columns: Column<ProductWithRecipe>[] = [
    {
      key: 'name',
      header: 'Nombre',
      cell: (product) => <span className="font-medium">{product.name}</span>,
      sortable: true
    },
    {
      key: 'recipe',
      header: 'Receta Base',
      cell: (product) => (
        <span className="text-sm text-muted-foreground">
          {product.recipe?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'base_cost',
      header: 'Costo Base',
      cell: (product) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Por porción: </span>
            <span className="font-medium">{formatCurrency(product.base_cost_cache)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Receta completa: </span>
            <span className="font-medium">{formatCurrency(product.base_cost_cache * (product.recipe?.servings || 1))}</span>
          </div>
        </div>
      )
    },
    {
      key: 'suggested_price',
      header: 'Precio Sugerido',
      cell: (product) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Por porción: </span>
            <button
              onClick={() => {
                setSelectedProduct(product)
                setShowEditPriceDialog(true)
              }}
              className="hover:underline text-blue-600 font-medium"
            >
              {formatCurrency(product.suggested_price_cache)}
            </button>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Receta completa: </span>
            <span className="font-medium text-blue-600">
              {formatCurrency(product.suggested_price_cache * (product.recipe?.servings || 1))}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'margin',
      header: 'Margen',
      cell: (product) => {
        const margin = ((product.suggested_price_cache / product.base_cost_cache - 1) * 100).toFixed(1)
        return (
          <Badge variant="secondary">
            {margin}%
          </Badge>
        )
      }
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cell: (product) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProduct(product)
              setShowEditPriceDialog(true)
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Precio
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(product.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const renderMobileCard = (product: ProductWithRecipe) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.recipe?.name || "Sin receta base"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-gray-600">Costo Base:</span>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Por porción:</span>
                  <span>{formatCurrency(product.base_cost_cache)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receta completa:</span>
                  <span>{formatCurrency(product.base_cost_cache * (product.recipe?.servings || 1))}</span>
                </div>
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Precio Sugerido:</span>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Por porción:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(product.suggested_price_cache)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receta completa:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(product.suggested_price_cache * (product.recipe?.servings || 1))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Margen:</span>
            <Badge variant="secondary">
              {((product.suggested_price_cache / product.base_cost_cache - 1) * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedProduct(product)
            setShowEditPriceDialog(true)
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Precio
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  const filteredProducts = debouncedSearch
    ? products.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : products

  if (initialProducts.length === 0 && !debouncedSearch) {
    return (
      <>
        <EmptyState
          icon={Package}
          title="No hay productos"
          description="Crea productos desde tus recetas o manualmente"
          action={{
            label: "Crear Producto",
            onClick: () => setShowCreateDialog(true),
          }}
        />
        <CreateProductDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          recipes={recipes}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Productos
            </h1>
            <p className="text-muted-foreground">
              Gestiona tu catálogo de productos
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="btn-gradient-purple"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          placeholder="Buscar productos por nombre..."
          isSearching={isSearching}
        />

        <DataTable
          data={filteredProducts}
          columns={columns}
          mobileCardRender={renderMobileCard}
          pagination={initialPagination ? {
            page: currentPage,
            pageSize: initialPagination.pageSize,
            total: initialPagination.total,
            onPageChange: setCurrentPage
          } : undefined}
          emptyState={
            <EmptyState
              icon={Package}
              title="No se encontraron productos"
              description={debouncedSearch ? `No hay productos que coincidan con "${debouncedSearch}"` : "No hay productos disponibles"}
            />
          }
        />
      </div>

      <CreateProductDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        recipes={recipes}
        onProductCreated={async () => {
          // Recargar la lista de productos
          const result = await getProducts({ page: currentPage, pageSize: initialPagination?.pageSize || 20 })
          if (result.success && result.data) {
            setProducts(result.data)
          }
        }}
      />

      {selectedProduct && (
        <EditPriceDialog
          open={showEditPriceDialog}
          onClose={() => {
            setShowEditPriceDialog(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
        />
      )}
    </>
  )
}