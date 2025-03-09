"use client"

import { MessageSquare, Plus, Settings, LogOut, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"
import clsx from "clsx"

interface ChatSidebarProps {
    isOpen: boolean
    activeMenu?: string
}

export function ChatSidebar({ isOpen, activeMenu = "chat" }: ChatSidebarProps) {
    const router = useRouter()

    const conversations = [
        { id: "1", title: "Productos Juan Perez", date: "Hoy" },
        { id: "2", title: "Productos Anita", date: "Ayer" },
        { id: "3", title: "Productos Marta", date: "12 Jun" },
    ]

    const menuItems = [
        { id: "chat", label: "Chat Asistente", icon: MessageSquare, path: "/" },
        { id: "pymes", label: "Catálogo Productos", icon: ShoppingBag, path: "/pymes" },
    ]

    const handleLogout = () => {
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("username")
        router.push("/login")
    }

    const navigateTo = (path: string) => {
        router.push(path)
    }

    if (!isOpen) {
        return null
    }

    return (
        <aside
            className={`w-64 bg-[#160f41] text-white flex flex-col h-full transition-all duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            } lg:relative absolute z-10`}
        >
            <div className="p-4 border-b border-[#2a2356]">
                <button
                    onClick={() => navigateTo("/")}
                    className="flex items-center justify-between w-full px-3 py-2 bg-[#d2006e] hover:bg-[#b00058] rounded-md transition-colors"
                >
                    <span className="font-medium">Nueva Conversación</span>
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="p-3">
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigateTo(item.path)}
                            className={clsx(
                                "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                                activeMenu === item.id ? "bg-[#2a2356] text-white" : "hover:bg-[#2a2356] text-gray-300"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {activeMenu === "chat" && (
                    <>
                        <div className="px-3 py-2">
                            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Conversaciones Recientes</h2>
                        </div>

                        <div className="space-y-1 px-2">
                            {conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-[#2a2356] transition-colors"
                                >
                                    <MessageSquare className="h-4 w-4 text-gray-300" />
                                    <div className="flex-1 text-left truncate">
                                        <span className="block truncate">{conversation.title}</span>
                                        <span className="text-xs text-gray-400">{conversation.date}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-3 border-t border-[#2a2356]">
                <div className="flex flex-col gap-1">
                   {/* <button className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-[#2a2356] transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Configuración</span>
                    </button>*/}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-[#2a2356] transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
