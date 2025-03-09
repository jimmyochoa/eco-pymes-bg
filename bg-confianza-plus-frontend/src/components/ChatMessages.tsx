"use client"

import { useEffect, useRef } from "react"
import type { MessageType } from "@/lib/types"
import clsx from "clsx"

interface ChatMessagesProps {
    messages: MessageType[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Function to render product table
    const renderProductTable = (products: MessageType["productTable"]) => {
        if (!products) return null

        return (
            <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-[#160f41] text-white">
                    <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                            Producto
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                            Precio
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                            Prob. Compra
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                            Prob. Pago
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                            Crédito
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td className="px-3 py-2 whitespace-nowrap font-medium">{product.nombre}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[#d2006e] font-medium">{product.precio}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${getScoreColor(product.calificacionCompra)}`}
                                            style={{ width: `${product.calificacionCompra}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 text-xs">{product.calificacionCompra}%</span>
                                </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${getScoreColor(product.calificacionPago)}`}
                                            style={{ width: `${product.calificacionPago}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 text-xs">{product.calificacionPago}%</span>
                                </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                  <span
                      className={clsx(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          product.recomendacionCredito === "Aprobado"
                              ? "bg-green-100 text-green-800"
                              : product.recomendacionCredito === "Rechazado"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                      )}
                  >
                    {product.recomendacionCredito}
                  </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )
    }

    // Helper function to get color based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-green-500"
        if (score >= 60) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                    <div key={message.id} className={clsx("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                            className={clsx(
                                "max-w-[80%] rounded-lg p-4",
                                message.role === "user" ? "bg-[#d2006e] text-white" : "bg-white border border-gray-200 text-[#160f41]",
                            )}
                        >
                            <p className="text-sm">{message.content}</p>

                            {/* Render product table if exists */}
                            {message.productTable && renderProductTable(message.productTable)}

                            <div className={clsx("text-xs mt-1", message.role === "user" ? "text-pink-100" : "text-gray-500")}>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}
