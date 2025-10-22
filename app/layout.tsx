import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/shared/Navbar"
import { NotificationToast } from "@/components/shared/NotificationToast"
import { ConnectionStatus } from "@/components/shared/ConnectionStatus"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "🍰 Dulce Repostería - Sistema de Gestión",
  description: "Sistema completo de gestión para emprendimientos de repostería. Controla tus recetas, pedidos, inventario y producción con facilidad.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
          <Navbar />
          <main className="flex-1 ml-64 p-8 lg:p-12 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <NotificationToast />
        <ConnectionStatus />
      </body>
    </html>
  )
}



