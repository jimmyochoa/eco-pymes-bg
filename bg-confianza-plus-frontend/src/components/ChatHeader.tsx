"use client"

import { Menu, LogOut } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ChatHeaderProps {
    toggleSidebar: () => void
}

export function ChatHeader({ toggleSidebar }: ChatHeaderProps) {
    const router = useRouter()

    const handleLogout = () => {
        // Clear login state
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("username")
        router.push("/login")
    }

    // Get username from localStorage (client-side only)
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null
    const pyme = typeof window !== "undefined" ? localStorage.getItem("pyme") : null
    const pymeName = pyme ? JSON.parse(pyme).nombreNegocio : null
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-5 w-5 text-[#160f41]" />
                </button>

                <div className="flex items-center gap-2">
                    <div className="relative h-8 w-24">
                        <Image src="/placeholder.svg?height=32&width=96" alt="Banco de Guayaquil" fill className="object-contain" />
                    </div>
                    <h1 className="text-lg font-semibold text-[#160f41] hidden sm:block">{`Asistente Virtual ${pymeName}`}</h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {username && (
                    <span className="text-sm text-gray-600 hidden md:inline-block">
            Bienvenido, <span className="font-medium">{username}</span>
          </span>
                )}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                    aria-label="Cerrar sesión"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    )
}

