"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check } from "lucide-react"
import { useNotificationStore } from "@/store/notificationStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderWithItems } from "@/lib/types"

interface WhatsAppMessageDialogProps {
  children: React.ReactNode
  order: OrderWithItems
}

export function WhatsAppMessageDialog({ children, order }: WhatsAppMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Generar el mensaje de WhatsApp
  const generateMessage = () => {
    // Obtener los productos del pedido
    const productsList = order.order_items.map((item) => {
      const product = item.product
      return `   • ${product.name} x${item.quantity} - ${formatCurrency(item.unit_price * item.quantity)}`
    }).join('\n')

    // Formatear fecha de entrega
    const deliveryDate = formatDate(order.delivery_date)
    const deliveryTime = order.delivery_time ? ` a las ${order.delivery_time}` : ''
    const deliveryInfo = `${deliveryDate}${deliveryTime}`

    // Construir el mensaje
    const message = `Hola! 👋
Te paso el presupuesto para tu pedido:

🧁 Tarta/s solicitada/s:
${productsList}

📦 Cantidad total: ${order.order_items.reduce((sum, item) => sum + item.quantity, 0)} producto(s)
💰 Precio total: ${formatCurrency(order.total_price)}
⏰ Entrega / Retiro: ${deliveryInfo}

${order.notes ? `📝 Notas adicionales: ${order.notes}\n\n` : ''}El precio incluye la preparación con ingredientes de primera calidad.
Si querés confirmar el pedido, te pido por favor hacerlo con 24 horas de anticipación.

¡Gracias por tu consulta! 💕`

    return message
  }

  const handleCopy = async () => {
    try {
      const message = generateMessage()
      await navigator.clipboard.writeText(message)
      setCopied(true)
      addNotification({
        type: "success",
        message: "Mensaje copiado al portapapeles"
      })
      
      // Reset el estado de copiado después de 2 segundos
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      addNotification({
        type: "error",
        message: "Error al copiar el mensaje"
      })
    }
  }

  const handleWhatsAppDirect = () => {
    const message = generateMessage()
    const encodedMessage = encodeURIComponent(message)
    // Abrir WhatsApp Web o la app móvil
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mensaje para WhatsApp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-green-800 mb-2">
                Este mensaje está listo para compartir con tu cliente. Podés copiarlo o enviarlo directamente por WhatsApp.
              </p>
            </div>

            {/* Mensaje preview */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Vista previa del mensaje:</label>
              <Textarea
                value={generateMessage()}
                readOnly
                className="min-h-[300px] sm:min-h-[350px] font-mono text-xs sm:text-sm bg-gray-50"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleCopy}
                className="flex-1 h-11 sm:h-10"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Mensaje
                  </>
                )}
              </Button>

              <Button
                onClick={handleWhatsAppDirect}
                className="flex-1 h-11 sm:h-10 bg-green-600 hover:bg-green-700"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Enviar por WhatsApp
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

