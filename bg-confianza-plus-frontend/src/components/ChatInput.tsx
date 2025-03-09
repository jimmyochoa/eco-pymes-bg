"use client"

import { useState, type FormEvent } from "react"
import { Send, Paperclip, Mic } from "lucide-react"

interface ChatInputProps {
    onSendMessage: (content: string) => void
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
    const [message, setMessage] = useState("")

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (message.trim()) {
            onSendMessage(message)
            setMessage("")
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <div className="flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#d2006e] focus-within:border-transparent">
                        <div className="flex items-center px-3 py-2">
                            <button
                                type="button"
                                className="p-1 rounded-full text-gray-500 hover:text-[#160f41] hover:bg-gray-100"
                                aria-label="Attach file"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe tu mensaje aquí..."
                                className="flex-1 border-0 focus:ring-0 resize-none max-h-32 py-2 px-3 text-sm"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSubmit(e)
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="p-1 rounded-full text-gray-500 hover:text-[#160f41] hover:bg-gray-100"
                                aria-label="Voice input"
                            >
                                <Mic className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="p-3 rounded-full bg-[#d2006e] text-white hover:bg-[#b00058] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!message.trim()}
                        aria-label="Send message"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>

                <div className="mt-2 text-xs text-center text-gray-500">Banco de Guayaquil - Asistente Virtual</div>
            </div>
        </div>
    )
}

