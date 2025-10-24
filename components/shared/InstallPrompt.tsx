'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Download, Smartphone, Bell } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar si es iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar si ya está instalado (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Detectar si ya se mostró el prompt antes
    const promptShown = localStorage.getItem('pwa-install-prompt-shown')
    const shouldShow = !promptShown && !standalone

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (shouldShow) {
        setShowPrompt(true)
      }
    }

    // Escuchar el evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      localStorage.setItem('pwa-install-prompt-shown', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Para iOS, mostrar instrucciones después de un delay
    if (iOS && shouldShow) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Mostrar después de 3 segundos

      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA')
      } else {
        console.log('Usuario rechazó instalar la PWA')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
      localStorage.setItem('pwa-install-prompt-shown', 'true')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-shown', 'true')
  }

  // No mostrar si ya está instalado o si ya se mostró
  if (isStandalone || isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🍰</span>
              </div>
              <CardTitle className="text-lg">Instalar App</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {isIOS ? (
              'Agrega esta app a tu pantalla de inicio para un acceso más rápido'
            ) : (
              'Instala la app para recibir notificaciones y acceso rápido'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Smartphone className="h-4 w-4 text-orange-500" />
                <span>1. Toca el botón de compartir</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Download className="h-4 w-4 text-orange-500" />
                <span>2. Selecciona "Agregar a pantalla de inicio"</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Bell className="h-4 w-4 text-orange-500" />
                <span>3. Permite notificaciones cuando se solicite</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="px-3"
              >
                Ahora no
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
