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
import { formatCurrency } from "@/lib/utils"
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
      
      // Create ingredient first
      const result = await createIngredient({
        ...data,
        image_url: imageUrl || undefined,
      })

             if (result.success) {
         // Register purchase (now required)
         if (purchaseQuantity > 0 && purchasePrice > 0 && unitValue) {
                     const purchaseResult = await registerPurchaseAction({
            ingredient_id: result.data!.id,
            purchase_date: new Date().toISOString().split('T')[0],
            quantity_purchased: purchaseQuantity,
            unit_purchased: unitValue, // Same as unit base
            total_price: purchasePrice,
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

          {/* Calculate Cost */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold mb-3">Calcular Costo</h3>
            <div className="space-y-3">
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
              {preview && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-primary">
                    Costo por {unitValue}: {preview}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este será el costo base del ingrediente para recetas y productos
                  </p>
                </div>
              )}
            </div>
          </div>

          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
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



