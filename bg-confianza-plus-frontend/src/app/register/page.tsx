"use client"

import type React from "react"
import { v4 as uuidv4 } from 'uuid';
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {ChevronLeft, ChevronRight, Building, User, Mail, Phone, MapPin, FileText, CheckCircle, Key} from "lucide-react"
import {createPymeAction} from "@/modules/pymes/infrastructure/actions";
import {Pyme} from "@/modules/pymes/domain/Pyme";
import bcrypt from "bcryptjs";

type FormData = {
    nombreNegocio: string
    ruc: string
    tipoNegocio: string
    sectorEconomico: string
    fechaConstitucion: string

    nombreRepresentante: string
    apellidoRepresentante: string
    identificacionRepresentante: string
    cargoRepresentante: string

    direccion: string
    ciudad: string
    provincia: string
    codigoPostal: string
    telefono: string
    email: string
    password: string

    numeroEmpleados: string
    ventasAnuales: string
    sitioWeb: string
    descripcionNegocio: string

    aceptaTerminos: boolean
}

const tiposNegocio = [
    "Seleccione el tipo de negocio",
    "Persona Natural",
    "Sociedad Anónima",
    "Compañía Limitada",
    "Empresa Unipersonal",
    "Otro",
]

const sectoresEconomicos = [
    "Seleccione el sector económico",
    "Comercio",
    "Servicios",
    "Manufactura",
    "Construcción",
    "Agricultura",
    "Tecnología",
    "Turismo",
    "Otro",
]

const provincias = [
    "Seleccione la provincia",
    "Azuay",
    "Bolívar",
    "Cañar",
    "Carchi",
    "Chimborazo",
    "Cotopaxi",
    "El Oro",
    "Esmeraldas",
    "Galápagos",
    "Guayas",
    "Imbabura",
    "Loja",
    "Los Ríos",
    "Manabí",
    "Morona Santiago",
    "Napo",
    "Orellana",
    "Pastaza",
    "Pichincha",
    "Santa Elena",
    "Santo Domingo",
    "Sucumbíos",
    "Tungurahua",
    "Zamora Chinchipe",
]

export default function RegistroNegocioPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [registroExitoso, setRegistroExitoso] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState<FormData>({
        nombreNegocio: "",
        ruc: "",
        tipoNegocio: "",
        sectorEconomico: "",
        fechaConstitucion: "",

        nombreRepresentante: "",
        apellidoRepresentante: "",
        identificacionRepresentante: "",
        cargoRepresentante: "",

        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        telefono: "",
        email: "",
        password: "",

        numeroEmpleados: "",
        ventasAnuales: "",
        sitioWeb: "",
        descripcionNegocio: "",

        aceptaTerminos: false,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}

        if (step === 1) {
            if (!formData.nombreNegocio.trim()) {
                newErrors.nombreNegocio = "El nombre del negocio es requerido"
            }

            if (!formData.ruc.trim()) {
                newErrors.ruc = "El RUC es requerido"
            } else if (!/^\d{13}$/.test(formData.ruc)) {
                newErrors.ruc = "El RUC debe tener 13 dígitos"
            }

            if (!formData.tipoNegocio || formData.tipoNegocio === tiposNegocio[0]) {
                newErrors.tipoNegocio = "Seleccione el tipo de negocio"
            }

            if (!formData.sectorEconomico || formData.sectorEconomico === sectoresEconomicos[0]) {
                newErrors.sectorEconomico = "Seleccione el sector económico"
            }

            if (!formData.fechaConstitucion) {
                newErrors.fechaConstitucion = "La fecha de constitución es requerida"
            }
        } else if (step === 2) {
            if (!formData.nombreRepresentante.trim()) {
                newErrors.nombreRepresentante = "El nombre es requerido"
            }

            if (!formData.apellidoRepresentante.trim()) {
                newErrors.apellidoRepresentante = "El apellido es requerido"
            }

            if (!formData.identificacionRepresentante.trim()) {
                newErrors.identificacionRepresentante = "La identificación es requerida"
            } else if (!/^\d{10}$/.test(formData.identificacionRepresentante)) {
                newErrors.identificacionRepresentante = "La cédula debe tener 10 dígitos"
            }

            if (!formData.cargoRepresentante.trim()) {
                newErrors.cargoRepresentante = "El cargo es requerido"
            }
        } else if (step === 3) {
            if (!formData.direccion.trim()) {
                newErrors.direccion = "La dirección es requerida"
            }

            if (!formData.ciudad.trim()) {
                newErrors.ciudad = "La ciudad es requerida"
            }

            if (!formData.provincia || formData.provincia === provincias[0]) {
                newErrors.provincia = "Seleccione la provincia"
            }

            if (!formData.telefono.trim()) {
                newErrors.telefono = "El teléfono es requerido"
            }

            if (!formData.email.trim()) {
                newErrors.email = "El correo electrónico es requerido"
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = "Ingrese un correo electrónico válido"
            }

            if (!formData.password.trim()) {
                newErrors.password = "La contraseña es requerida"
            }

        } else if (step === 4) {
            if (!formData.aceptaTerminos) {
                newErrors.aceptaTerminos = "Debe aceptar los términos y condiciones"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => prev + 1)
            window.scrollTo(0, 0)
        }
    }

    const prevStep = () => {
        setCurrentStep((prev) => prev - 1)
        window.scrollTo(0, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const uuid = uuidv4();

        if (validateStep(currentStep)) {
           // setIsSubmitting(true)
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(formData.password, salt);
            const pyme: Pyme = {
                id: uuid,
                nombreNegocio: formData.nombreNegocio,
                ruc: formData.ruc,
                tipoNegocio: formData.tipoNegocio,
                sectorEconomico: formData.sectorEconomico,
                fechaConstitucion: formData.fechaConstitucion,
                nombreRepresentante: formData.nombreRepresentante,
                apellidoRepresentante: formData.apellidoRepresentante,
                identificacionRepresentante: formData.identificacionRepresentante,
                cargoRepresentante: formData.cargoRepresentante,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                provincia: formData.provincia,
                codigoPostal: formData.codigoPostal,
                telefono: formData.telefono,
                email: formData.email,
                password: hash,
                numeroEmpleados: formData.numeroEmpleados,
                ventasAnuales: formData.ventasAnuales,
                sitioWeb: formData.sitioWeb,
                descripcionNegocio: formData.descripcionNegocio,
                aceptaTerminos: formData.aceptaTerminos
            };

            const pymeData = await createPymeAction(pyme);
            setIsSubmitting(false)
            setRegistroExitoso(true)
            router.push("/login")
        }
    }

    const volverInicio = () => {
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Cabecera */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="relative h-10 w-32">
                            <Image
                                src="/placeholder.svg?height=40&width=128"
                                alt="Banco de Guayaquil"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="ml-4 text-xl font-semibold text-[#160f41]">Registro de Negocios</h1>
                    </div>
                    <button onClick={volverInicio} className="text-[#d2006e] hover:text-[#b00058] text-sm font-medium">
                        Volver al inicio
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
                {/* Indicador de progreso */}
                {!registroExitoso && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                        currentStep >= step ? "bg-[#d2006e] text-white" : "bg-gray-200 text-gray-500"
                                    }`}
                                >
                                    {step}
                                </div>
                            ))}
                        </div>
                        <div className="relative">
                            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
                            <div
                                className="absolute top-0 left-0 h-1 bg-[#d2006e] transition-all duration-300"
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Información del Negocio</span>
                            <span>Representante Legal</span>
                            <span>Contacto</span>
                            <span>Finalizar</span>
                        </div>
                    </div>
                )}

                {/* Formulario de registro */}
                {!registroExitoso ? (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-[#160f41]">
                                {currentStep === 1 && "Información del Negocio"}
                                {currentStep === 2 && "Representante Legal"}
                                {currentStep === 3 && "Información de Contacto"}
                                {currentStep === 4 && "Información Adicional"}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {currentStep === 1 && "Ingrese los datos principales de su negocio"}
                                {currentStep === 2 && "Datos del representante legal del negocio"}
                                {currentStep === 3 && "Información de contacto y ubicación"}
                                {currentStep === 4 && "Complete la información adicional y revise sus datos"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5">
                                {/* Paso 1: Información del Negocio */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="nombreNegocio" className="block text-sm font-medium text-gray-700">
                                                Nombre del Negocio <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="nombreNegocio"
                                                    name="nombreNegocio"
                                                    value={formData.nombreNegocio}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.nombreNegocio ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="Nombre comercial de su negocio"
                                                />
                                            </div>
                                            {errors.nombreNegocio && <p className="mt-1 text-sm text-red-600">{errors.nombreNegocio}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="ruc" className="block text-sm font-medium text-gray-700">
                                                RUC <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FileText className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="ruc"
                                                    name="ruc"
                                                    value={formData.ruc}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.ruc ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="13 dígitos"
                                                    maxLength={13}
                                                />
                                            </div>
                                            {errors.ruc && <p className="mt-1 text-sm text-red-600">{errors.ruc}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="tipoNegocio" className="block text-sm font-medium text-gray-700">
                                                    Tipo de Negocio <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="tipoNegocio"
                                                    name="tipoNegocio"
                                                    value={formData.tipoNegocio}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full py-2 px-3 border ${
                                                        errors.tipoNegocio ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                >
                                                    {tiposNegocio.map((tipo, index) => (
                                                        <option key={index} value={index === 0 ? "" : tipo}>
                                                            {tipo}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.tipoNegocio && <p className="mt-1 text-sm text-red-600">{errors.tipoNegocio}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="sectorEconomico" className="block text-sm font-medium text-gray-700">
                                                    Sector Económico <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="sectorEconomico"
                                                    name="sectorEconomico"
                                                    value={formData.sectorEconomico}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full py-2 px-3 border ${
                                                        errors.sectorEconomico ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                >
                                                    {sectoresEconomicos.map((sector, index) => (
                                                        <option key={index} value={index === 0 ? "" : sector}>
                                                            {sector}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.sectorEconomico && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.sectorEconomico}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="fechaConstitucion" className="block text-sm font-medium text-gray-700">
                                                Fecha de Constitución <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                id="fechaConstitucion"
                                                name="fechaConstitucion"
                                                value={formData.fechaConstitucion}
                                                onChange={handleChange}
                                                className={`mt-1 block w-full py-2 px-3 border ${
                                                    errors.fechaConstitucion ? "border-red-300" : "border-gray-300"
                                                } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                            />
                                            {errors.fechaConstitucion && (
                                                <p className="mt-1 text-sm text-red-600">{errors.fechaConstitucion}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Paso 2: Representante Legal */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="nombreRepresentante" className="block text-sm font-medium text-gray-700">
                                                    Nombre <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="nombreRepresentante"
                                                        name="nombreRepresentante"
                                                        value={formData.nombreRepresentante}
                                                        onChange={handleChange}
                                                        className={`block w-full pl-10 pr-3 py-2 border ${
                                                            errors.nombreRepresentante ? "border-red-300" : "border-gray-300"
                                                        } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                        placeholder="Nombre"
                                                    />
                                                </div>
                                                {errors.nombreRepresentante && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.nombreRepresentante}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="apellidoRepresentante" className="block text-sm font-medium text-gray-700">
                                                    Apellido <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="apellidoRepresentante"
                                                        name="apellidoRepresentante"
                                                        value={formData.apellidoRepresentante}
                                                        onChange={handleChange}
                                                        className={`block w-full pl-10 pr-3 py-2 border ${
                                                            errors.apellidoRepresentante ? "border-red-300" : "border-gray-300"
                                                        } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                        placeholder="Apellido"
                                                    />
                                                </div>
                                                {errors.apellidoRepresentante && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.apellidoRepresentante}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="identificacionRepresentante" className="block text-sm font-medium text-gray-700">
                                                Cédula de Identidad <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FileText className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="identificacionRepresentante"
                                                    name="identificacionRepresentante"
                                                    value={formData.identificacionRepresentante}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.identificacionRepresentante ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="10 dígitos"
                                                    maxLength={10}
                                                />
                                            </div>
                                            {errors.identificacionRepresentante && (
                                                <p className="mt-1 text-sm text-red-600">{errors.identificacionRepresentante}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="cargoRepresentante" className="block text-sm font-medium text-gray-700">
                                                Cargo <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    id="cargoRepresentante"
                                                    name="cargoRepresentante"
                                                    value={formData.cargoRepresentante}
                                                    onChange={handleChange}
                                                    className={`block w-full px-3 py-2 border ${
                                                        errors.cargoRepresentante ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="Ej: Gerente General, Propietario, etc."
                                                />
                                            </div>
                                            {errors.cargoRepresentante && (
                                                <p className="mt-1 text-sm text-red-600">{errors.cargoRepresentante}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Paso 3: Información de Contacto */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                                                Dirección <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="direccion"
                                                    name="direccion"
                                                    value={formData.direccion}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.direccion ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="Dirección completa"
                                                />
                                            </div>
                                            {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700">
                                                    Ciudad <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="ciudad"
                                                    name="ciudad"
                                                    value={formData.ciudad}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full px-3 py-2 border ${
                                                        errors.ciudad ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="Ciudad"
                                                />
                                                {errors.ciudad && <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                                                    Provincia <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="provincia"
                                                    name="provincia"
                                                    value={formData.provincia}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full py-2 px-3 border ${
                                                        errors.provincia ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                >
                                                    {provincias.map((provincia, index) => (
                                                        <option key={index} value={index === 0 ? "" : provincia}>
                                                            {provincia}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.provincia && <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700">
                                                    Código Postal
                                                </label>
                                                <input
                                                    type="text"
                                                    id="codigoPostal"
                                                    name="codigoPostal"
                                                    value={formData.codigoPostal}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                                    placeholder="Código Postal"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                                                    Teléfono <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        id="telefono"
                                                        name="telefono"
                                                        value={formData.telefono}
                                                        onChange={handleChange}
                                                        className={`block w-full pl-10 pr-3 py-2 border ${
                                                            errors.telefono ? "border-red-300" : "border-gray-300"
                                                        } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                        placeholder="Teléfono de contacto"
                                                    />
                                                </div>
                                                {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Correo Electrónico <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.email ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="correo@ejemplo.com"
                                                />
                                            </div>
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                Contraseña <span className="text-red-500">*</span>
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Key className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                                        errors.password ? "border-red-300" : "border-gray-300"
                                                    } rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]`}
                                                    placeholder="******"
                                                />
                                            </div>
                                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Paso 4: Información Adicional y Finalización */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="numeroEmpleados" className="block text-sm font-medium text-gray-700">
                                                    Número de Empleados
                                                </label>
                                                <input
                                                    type="number"
                                                    id="numeroEmpleados"
                                                    name="numeroEmpleados"
                                                    value={formData.numeroEmpleados}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                                    placeholder="Ej: 10"
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="ventasAnuales" className="block text-sm font-medium text-gray-700">
                                                    Ventas Anuales Estimadas ($)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="ventasAnuales"
                                                    name="ventasAnuales"
                                                    value={formData.ventasAnuales}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                                    placeholder="Ej: 100000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="sitioWeb" className="block text-sm font-medium text-gray-700">
                                                Sitio Web
                                            </label>
                                            <input
                                                type="url"
                                                id="sitioWeb"
                                                name="sitioWeb"
                                                value={formData.sitioWeb}
                                                onChange={handleChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                                placeholder="https://www.ejemplo.com"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="descripcionNegocio" className="block text-sm font-medium text-gray-700">
                                                Descripción del Negocio
                                            </label>
                                            <textarea
                                                id="descripcionNegocio"
                                                name="descripcionNegocio"
                                                value={formData.descripcionNegocio}
                                                onChange={handleChange}
                                                rows={3}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                                placeholder="Breve descripción de su negocio y actividades"
                                            ></textarea>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="aceptaTerminos"
                                                        name="aceptaTerminos"
                                                        type="checkbox"
                                                        checked={formData.aceptaTerminos}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-[#d2006e] focus:ring-[#d2006e] border-gray-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="aceptaTerminos" className="font-medium text-gray-700">
                                                        Acepto los términos y condiciones <span className="text-red-500">*</span>
                                                    </label>
                                                    <p className="text-gray-500">
                                                        Al registrarme, acepto los términos y condiciones del Banco de Guayaquil y autorizo el
                                                        tratamiento de mis datos personales.
                                                    </p>
                                                    {errors.aceptaTerminos && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.aceptaTerminos}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-between">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Anterior
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#d2006e] hover:bg-[#b00058]"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#d2006e] hover:bg-[#b00058] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Procesando...
                                            </>
                                        ) : (
                                            "Completar Registro"
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#160f41] mb-2">¡Registro Exitoso!</h2>
                            <p className="text-gray-600 mb-6">
                                Su negocio ha sido registrado correctamente en nuestro sistema.
                            </p>
                            <div className="flex justify-center">
                                <button
                                    onClick={volverInicio}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#d2006e] hover:bg-[#b00058]"
                                >
                                    Volver al Inicio
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
                    <p>© 2025 Banco de Guayaquil. Todos los derechos reservados.</p>
                    <div className="mt-2 space-x-4">
                        <a href="#" className="hover:text-[#d2006e]">
                            Términos y Condiciones
                        </a>
                        <a href="#" className="hover:text-[#d2006e]">
                            Política de Privacidad
                        </a>
                        <a href="#" className="hover:text-[#d2006e]">
                            Contacto
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

