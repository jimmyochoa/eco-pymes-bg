"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Lock, User, Shield } from "lucide-react"
import {getPymeByEmailAction} from "@/modules/pymes/infrastructure/actions";
import bcrypt from "bcryptjs";

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        rememberMe: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const checkPassword = async (password: string, passwordSaved: string) => {
        return await bcrypt.compare(password, passwordSaved);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        console.log("hay que loguearse");
        const pyme = await getPymeByEmailAction(formData.username);
       const isPasswordCorrect = await checkPassword(formData.password, (pyme[0].password));

        if (isPasswordCorrect) {
            localStorage.setItem("isLoggedIn", "true")
            localStorage.setItem("username", formData.username)
            localStorage.setItem("pyme", JSON.stringify(pyme[0]))
            router.push("/")
        } else {
           setError("Por favor ingrese un usuario y contraseña válidos.")
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="relative h-16 w-48">
                        <Image
                            src="/placeholder.svg?height=64&width=192"
                            alt="Banco de Guayaquil"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-[#160f41]">BG ConfianzaPlus </h2>
                <p className="mt-2 text-center text-sm text-gray-600">Ingrese sus credenciales para acceder a su cuenta</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                            <p>{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Usuario
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                    placeholder="Ingrese su usuario"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                    placeholder="Ingrese su contraseña"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-[#d2006e] focus:ring-[#d2006e] border-gray-300 rounded"
                                />
                                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                                    Recordarme
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-[#d2006e] hover:text-[#b00058]">
                                    ¿Olvidó su contraseña?
                                </a>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#d2006e] hover:bg-[#b00058] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d2006e] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push("/register")}
                                className="w-full flex justify-center py-2 px-4 border border-[#d2006e] rounded-md shadow-sm text-sm font-medium text-[#d2006e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d2006e]"
                            >
                                Registrar Nuevo Negocio
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Información de seguridad</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-[#160f41] mr-2" />
                            <p className="text-xs text-gray-600">Su información está protegida con encriptación de 256 bits</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
                <p>© 2025 Banco de Guayaquil. Todos los derechos reservados.</p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-[#d2006e]">
                        Términos y Condiciones
                    </a>
                    <a href="#" className="hover:text-[#d2006e]">
                        Política de Privacidad
                    </a>
                    <a href="#" className="hover:text-[#d2006e]">
                        Seguridad
                    </a>
                </div>
            </div>
        </div>
    )
}

