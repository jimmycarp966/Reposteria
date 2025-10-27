"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ingredientSchema } from "@/lib/validations"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createIngredient, registerPurchase as registerPurchaseAction } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { UnitSelector } from "@/components/shared/UnitSelector"
import { Textarea } from "@/components/ui/textarea"
import { areUnitsCompatible, convertUnits } from "@/components/shared/UnitSelector"

interface CreateIngredientDialogProps {
  children?: React.ReactNode
  open?: boolean
  onClose?: () => void
}

type FormData = z.infer<typeof ingredientSchema>

export function CreateIngredientDialog({ children, open: externalOpen, onClose: externalOnClose }: CreateIngredientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = externalOpen !== undefined && externalOnClose !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      if (!newOpen) {
        externalOnClose?.()
      }
    } else {
      setInternalOpen(newOpen)
    }
  }
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [registerPurchase, setRegisterPurchase] = useState(true)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(ingredientSchema),
  })

  const unitValue = watch("unit")
  const [purchaseUnit, setPurchaseUnit] = useState("")
  const [purchaseQuantity, setPurchaseQuantity] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)

  // Calculate preview of unit cost
  const calculatePreview = () => {
    if (!purchaseQuantity || !purchasePrice || purchaseQuantity <= 0 || purchasePrice <= 0) {
      return null
    }
    
    if (!unitValue || !areUnitsCompatible(purchaseUnit, unitValue)) {
      return "Unidades incompatibles"
    }
    
    const convertedQuantity = convertUnits(purchaseQuantity, purchaseUnit, unitValue)
    const unitCost = purchasePrice / convertedQuantity
    
    return `$${unitCost.toFixed(4)}/${unitValue}`
  }

  const preview = calculatePreview()

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      
      // Create ingredient first
      const result = await createIngredient({
        ...data,
        image_url: imageUrl || undefined,
      })

      if (result.success) {
        // Register purchase (now required)
        if (purchaseQuantity > 0 && purchasePrice > 0 && purchaseUnit) {
          const purchaseResult = await registerPurchaseAction({
            ingredient_id: result.data!.id,
            purchase_date: new Date().toISOString().split('T')[0],
            quantity_purchased: purchaseQuantity,
            unit_purchased: purchaseUnit,
            total_price: purchasePrice,
            supplier: data.supplier,
            notes: `Costo calculado al crear el ingrediente`,
          })
          
          if (purchaseResult.success) {
            addNotification({ type: "success", message: "Ingrediente creado exitosamente" })
          } else {
            addNotification({ type: "success", message: result.message! })
            addNotification({ type: "warning", message: "El ingrediente fue creado pero el costo no pudo calcularse" })
          }
        } else {
          addNotification({ type: "error", message: "Debe ingresar cantidad y precio para calcular el costo del ingrediente" })
          return
        }
        
        reset()
        setImageUrl("")
        setRegisterPurchase(true)
        setPurchaseUnit("")
        setPurchaseQuantity(0)
        setPurchasePrice(0)
        handleOpenChange(false)
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ingrediente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unidad *</Label>
              <UnitSelector
                value={unitValue}
                onChange={(value) => setValue("unit", value)}
                placeholder="Seleccionar unidad"
                categories={['weight', 'volume', 'count']}
                showCategories={true}
              />
              {errors.unit && (
                <p className="text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cost_per_unit">Costo por Unidad *</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                {...register("cost_per_unit", { valueAsNumber: true })}
              />
              {errors.cost_per_unit && (
                <p className="text-sm text-red-600">{errors.cost_per_unit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Input id="supplier" {...register("supplier")} />
            </div>

            <div>
              <Label htmlFor="lead_time_days">Días de Entrega</Label>
              <div className="flex gap-2">
                <Input
                  id="lead_time_days"
                  type="number"
                  placeholder="Ej: 3"
                  {...register("lead_time_days", { valueAsNumber: true })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("lead_time_days", null)}
                  className="whitespace-nowrap"
                >
                  No aplica
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Días que tarda el proveedor en entregar. Usar "No aplica" para ingredientes del supermercado.
              </p>
            </div>
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
          />

          {/* Calculate Cost from Purchase */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Calcular Costo del Ingrediente</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresa cuánto pagaste y cuánto compraste para calcular automáticamente el costo por unidad.
            </p>
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                                      <Label htmlFor="purchase_quantity">Cantidad</Label>
                  <Input
                    id="purchase_quantity"
                    type="number"
                    step="0.001"
                    placeholder="Ej: 200"
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">¿Cuánto compraste?</p>
                  </div>
                  <div>
                    <Label htmlFor="purchase_unit">Unidad de Compra</Label>
                    <UnitSelector
                      value={purchaseUnit || unitValue || ""}
                      onChange={(value) => setPurchaseUnit(value)}
                      placeholder="Seleccionar unidad"
                      categories={['weight', 'volume', 'count']}
                      showCategories={true}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="purchase_price">Precio Total</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2000"
                    value={purchasePrice || ""}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">¿Cuánto pagaste?</p>
                </div>
                {preview && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm font-semibold text-primary">
                      Costo por unidad: {preview}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este será el costo base del ingrediente para recetas y productos
                    </p>
                  </div>
                )}
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Ingrediente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



