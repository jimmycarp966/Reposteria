import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/shared/Navbar"
import { NotificationToast } from "@/components/shared/NotificationToast"
import { ConnectionStatus } from "@/components/shared/ConnectionStatus"
import { MobileSidebar } from "@/components/shared/MobileSidebar"
import { Header } from "@/components/shared/Header"

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
        <div className="relative flex min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
          <Navbar />
          <MobileSidebar />
          <main className="flex-1 lg:ml-64 animate-fade-in">
            <Header />
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
        <NotificationToast />
        <ConnectionStatus />
      </body>
    </html>
  )
}



