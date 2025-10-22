"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Intentar hacer una consulta simple a Supabase
        const response = await fetch('/api/health', { 
          method: 'GET',
          cache: 'no-cache'
        })
        setIsConnected(response.ok)
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return null // No mostrar nada mientras verifica
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-2"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Conectado
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Modo Demo
          </>
        )}
      </Badge>
    </div>
  )
}
