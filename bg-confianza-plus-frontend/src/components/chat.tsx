"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { MessageType } from "@/lib/types"
import {ChatSidebar} from "@/components/ChatSidebar";
import {ChatHeader} from "@/components/ChatHeader";
import {ChatInput} from "@/components/ChatInput";
import {ChatMessages} from "@/components/ChatMessages";

export function Chat() {
    const router = useRouter()
    const [messages, setMessages] = useState<MessageType[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    useEffect(() => {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem("isLoggedIn")
        if (!isLoggedIn) {
            router.push("/login")
            return
        }

        // Get username for personalized greeting
        const username = localStorage.getItem("username") || "cliente"

        // Set initial welcome message
        setMessages([
            {
                id: "1",
                content: `Hola ${username}, soy el asistente virtual de Banco de Guayaquil. ¿En qué puedo ayudarte hoy?`,
                role: "assistant",
                createdAt: new Date(),
            },
        ])
    }, [router])

    // Modificar la función handleSendMessage para detectar preguntas sobre inventario
    const handleSendMessage = (content: string) => {
        if (!content.trim()) return

        // Add user message
        const userMessage: MessageType = {
            id: Date.now().toString(),
            content,
            role: "user",
            createdAt: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        // Check if the message is about inventory and Juan Pérez
        const lowerContent = content.toLowerCase()
        if (
            (lowerContent.includes("inventario") || lowerContent.includes("productos")) &&
            lowerContent.includes("juan p") &&
            (lowerContent.includes("1234567890") || lowerContent.includes("cedula"))
        ) {
            // Simulate assistant response with product table
            setTimeout(() => {
                const assistantMessage: MessageType = {
                    id: (Date.now() + 1).toString(),
                    content: `Basado en el historial crediticio y comportamiento de compra de Juan Pérez (Cédula: 1234567890), aquí está el análisis de productos recomendados:`,
                    role: "assistant",
                    createdAt: new Date(),
                    productTable: [
                        {
                            id: "1",
                            nombre: "Refrigeradora Side by Side",
                            precio: "$1,299.99",
                            calificacionPago: 85,
                            calificacionCompra: 78,
                            recomendacionCredito: "Aprobado",
                        },
                        {
                            id: "2",
                            nombre: 'Smart TV 4K UHD 65"',
                            precio: "$899.99",
                            calificacionPago: 92,
                            calificacionCompra: 95,
                            recomendacionCredito: "Aprobado",
                        },
                        {
                            id: "3",
                            nombre: "Lavadora de Carga Frontal",
                            precio: "$749.99",
                            calificacionPago: 70,
                            calificacionCompra: 65,
                            recomendacionCredito: "Evaluación Manual",
                        },
                        {
                            id: "4",
                            nombre: "Cocina de Inducción",
                            precio: "$650.00",
                            calificacionPago: 88,
                            calificacionCompra: 72,
                            recomendacionCredito: "Aprobado",
                        },
                        {
                            id: "5",
                            nombre: "Laptop Ultrabook i7",
                            precio: "$1,200.00",
                            calificacionPago: 65,
                            calificacionCompra: 90,
                            recomendacionCredito: "Evaluación Manual",
                        },
                    ],
                }

                setMessages((prev) => [...prev, assistantMessage])
            }, 1500)
        } else {
            // Default response for other queries
            setTimeout(() => {
                const assistantMessage: MessageType = {
                    id: (Date.now() + 1).toString(),
                    content: "Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte?",
                    role: "assistant",
                    createdAt: new Date(),
                }

                setMessages((prev) => [...prev, assistantMessage])
            }, 1000)
        }
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    return (
        <div className="flex h-screen bg-white">
            <ChatSidebar isOpen={isSidebarOpen} />

            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <ChatHeader toggleSidebar={toggleSidebar} />

                <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatMessages messages={messages} />
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            </div>
        </div>
    )
}

