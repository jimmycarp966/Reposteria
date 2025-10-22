"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/store/sidebarStore"

export function Header() {
  const toggleSidebar = useSidebarStore((state) => state.toggle)

  return (
    <header className="lg:hidden flex items-center h-16 px-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle Menu">
        <Menu className="h-6 w-6" />
      </Button>
    </header>
  )
}
