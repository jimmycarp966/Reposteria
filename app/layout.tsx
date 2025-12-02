import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/shared/Navbar"
import { NotificationToast } from "@/components/shared/NotificationToast"
import { MobileSidebar } from "@/components/shared/MobileSidebar"
import { Header } from "@/components/shared/Header"
import { InstallPrompt } from "@/components/shared/InstallPrompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "🍰 Cam Bake - Sistema de Gestión",
  description: "Sistema completo de gestión para Cam Bake. Controla tus recetas, pedidos, inventario y producción con facilidad.",
  manifest: "/manifest.json",
  themeColor: "#f97316",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cam Bake",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Cam Bake",
    title: "🍰 Cam Bake - Sistema de Gestión",
    description: "Sistema completo de gestión para Cam Bake. Controla tus recetas, pedidos, inventario y producción con facilidad.",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    shortcut: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags adicionales para PWA */}
        <meta name="application-name" content="Cam Bake" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cam Bake" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Meta tags para iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.svg" />
        
        {/* Meta tags para Android */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg" />
        <link rel="mask-icon" href="/icons/icon-192x192.svg" color="#f97316" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className={inter.className}>
        <div className="relative flex min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
          <Navbar />
          <MobileSidebar />
          <main className="flex-1 lg:ml-64 animate-fade-in flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
            
            {/* Footer */}
            <footer className="mt-auto py-6 px-4 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto">
                <p className="text-center text-xs sm:text-sm text-gray-600">
                  © {new Date().getFullYear()} Cam Bake. Todos los derechos reservados • Diseñado por{' '}
                  <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 cursor-default">
                    SiriuS
                  </span>
                </p>
              </div>
            </footer>
          </main>
        </div>
        <NotificationToast />
        <InstallPrompt />
      </body>
    </html>
  )
}



