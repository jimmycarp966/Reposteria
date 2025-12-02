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
import { formatCurrency, getTodayGMT3 } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { areUnitsCompatible, convertUnits } from "@/components/shared/UnitSelector"

interface CreateIngredientDialogProps {
  children?: React.ReactNode
  open?: boolean
  onClose?: () => void
  onIngredientCreated?: () => void
}

type FormData = z.infer<typeof ingredientSchema>

export function CreateIngredientDialog({
  children,
  open: externalOpen,
  onClose: externalOnClose,
  onIngredientCreated
}: CreateIngredientDialogProps) {
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
  const [registerPurchase, setRegisterPurchase] = useState(false)
  const [affectsStock, setAffectsStock] = useState(false)
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
  // purchaseUnit now always equals unitValue - no need for separate state
  const [purchaseQuantity, setPurchaseQuantity] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)

  // Calculate preview of unit cost
  const calculatePreview = () => {
    if (!purchaseQuantity || !purchasePrice || purchaseQuantity <= 0 || purchasePrice <= 0) {
      return null
    }
    
    if (!unitValue) {
      return null
    }
    
    // Since purchaseUnit = unitValue, no conversion needed
    const unitCost = purchasePrice / purchaseQuantity

    return `${formatCurrency(unitCost)}/${unitValue}`
  }

  const preview = calculatePreview()

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      console.log('🚀 DEBUG: Iniciando creación de ingrediente')
      console.log('📋 Form data:', data)
      console.log('📦 Purchase state:', { purchaseQuantity, purchasePrice, unitValue, registerPurchase, affectsStock })

      // Create ingredient first
      const ingredientData = {
        ...data,
        image_url: imageUrl || undefined,
        cost_per_unit: 0, // Valor por defecto, se actualizará después si se registra la compra
      }

      console.log('📤 Datos a enviar a createIngredient:', ingredientData)

      const result = await createIngredient(ingredientData)

      console.log('📝 Resultado creación ingrediente:', result)

      if (!result.success) {
        console.error('❌ ERROR DETALLADO:', {
          message: result.message,
          fullResult: result
        })
        addNotification({ type: "error", message: result.message! })
        return
      }

      if (result.success) {
        console.log('✅ Ingrediente creado exitosamente, ID:', result.data?.id)

        let purchaseSuccess = false

        // Solo registrar compra si el usuario lo indicó
        if (registerPurchase && purchaseQuantity > 0 && purchasePrice > 0 && data.unit) {
          console.log('🔄 Registrando compra...')

          const purchaseData = {
            ingredient_id: result.data!.id,
            purchase_date: getTodayGMT3(),
            quantity_purchased: purchaseQuantity,
            unit_purchased: data.unit,
            total_price: purchasePrice,
            supplier: data.supplier || undefined,
            notes: `Costo calculado al crear el ingrediente`,
            affects_stock: affectsStock,
          }

          console.log('📊 Datos de compra a enviar:', purchaseData)

          const purchaseResult = await registerPurchaseAction(purchaseData)

          console.log('💰 Resultado registro de compra:', purchaseResult)

          if (purchaseResult.success) {
            console.log('🎉 Compra registrada exitosamente')
            purchaseSuccess = true
            const stockMessage = affectsStock ? " y agregado al stock" : " (sin afectar stock)"
            addNotification({
              type: "success",
              message: `Ingrediente creado exitosamente con costo calculado${stockMessage}`
            })
          } else {
            console.log('❌ Error en registro de compra:', purchaseResult.message)
            addNotification({
              type: "warning",
              message: `El ingrediente "${data.name}" fue creado, pero no se pudo calcular el costo. Error: ${purchaseResult.message}. Puede actualizar el costo manualmente después.`
            })
          }
        } else if (registerPurchase && (purchaseQuantity <= 0 || purchasePrice <= 0)) {
          console.log('⚠️  Se indicó registrar compra pero faltan datos')
          addNotification({
            type: "warning",
            message: `Ingrediente "${data.name}" creado. Para calcular el costo debe ingresar cantidad y precio válidos.`
          })
        } else {
          console.log('ℹ️  Ingrediente creado sin registro de compra')
          addNotification({
            type: "success",
            message: `Ingrediente "${data.name}" creado exitosamente. Puede registrar compras después para calcular el costo.`
          })
        }

        // Refrescar datos después de crear el ingrediente
        console.log('🔄 Actualizando lista de ingredientes')
        reset()
        setImageUrl("")
        setRegisterPurchase(false)
        setAffectsStock(false)
        setPurchaseQuantity(0)
        setPurchasePrice(0)
        handleOpenChange(false)

        // Llamar callback para actualizar la lista
        onIngredientCreated?.()
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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

          <div>
            <Label htmlFor="unit">Unidad Base *</Label>
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
            <p className="text-xs text-muted-foreground mt-1">
              La unidad en la que se medirá este ingrediente (ej: gramos para harina)
            </p>
          </div>

          {/* Calculate Cost - Optional */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="register_purchase"
                checked={registerPurchase}
                onChange={(e) => setRegisterPurchase(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="register_purchase" className="text-base font-semibold cursor-pointer">
                Calcular costo desde una compra
              </Label>
            </div>

            {registerPurchase && (
              <div className="space-y-3 ml-6">
                <div>
                  <Label htmlFor="purchase_quantity">Cantidad Comprada *</Label>
                  <Input
                    id="purchase_quantity"
                    type="number"
                    step="0.001"
                    placeholder={`Ej: 200 (en ${unitValue || "la unidad base"})`}
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cantidad en {unitValue || "la unidad base seleccionada"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="purchase_price">Precio Total *</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2000"
                    value={purchasePrice || ""}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">¿Cuánto pagaste en total?</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="affects_stock"
                    checked={affectsStock}
                    onChange={(e) => setAffectsStock(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="affects_stock" className="text-sm cursor-pointer">
                    Agregar cantidad al stock actual
                  </Label>
                </div>

                {preview && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm font-semibold text-primary">
                      Costo por {unitValue}: {preview}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este será el costo base del ingrediente para recetas y productos
                      {affectsStock && " y se agregará al stock"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
            bucket="product-images"
            folder="ingredients"
          />

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



