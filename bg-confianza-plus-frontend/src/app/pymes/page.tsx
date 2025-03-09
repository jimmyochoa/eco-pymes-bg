"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Download, Filter, Search, ArrowUpDown } from "lucide-react"
import {ChatSidebar} from "@/components/ChatSidebar";
import {ChatHeader} from "@/components/ChatHeader";

// Product type definition
interface Product {
    id: string
    name: string
    category: string
    brand: string
    model: string
    price: string
    stock: number
    features: string
}

export default function PymesPage() {
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [isImporting, setIsImporting] = useState<boolean>(false)

    // Sample electronics products data
    const products: Product[] = [
        {
            id: "1",
            name: "Refrigeradora Side by Side",
            category: "Refrigeración",
            brand: "Samsung",
            model: "RS27T5200S9",
            price: "$1,299.99",
            stock: 15,
            features: "27 pies cúbicos, dispensador de agua y hielo, Twin Cooling Plus",
        },
        {
            id: "2",
            name: "Lavadora de Carga Frontal",
            category: "Lavado",
            brand: "LG",
            model: "WM3600HWA",
            price: "$749.99",
            stock: 8,
            features: "4.5 pies cúbicos, 14 ciclos, TurboWash, WiFi",
        },
        {
            id: "3",
            name: "Smart TV 4K UHD",
            category: "Televisores",
            brand: "Sony",
            model: "X80J",
            price: "$899.99",
            stock: 22,
            features: "65 pulgadas, 4K UHD, Android TV, Procesador X1",
        },
        {
            id: "4",
            name: "Horno Microondas Digital",
            category: "Cocina",
            brand: "Whirlpool",
            model: "WMH31017HS",
            price: "$189.99",
            stock: 30,
            features: "1.7 pies cúbicos, 1000W, 10 niveles de potencia",
        },
        {
            id: "5",
            name: "Aire Acondicionado Split",
            category: "Climatización",
            brand: "Daikin",
            model: "FTXS25LVMA",
            price: "$549.99",
            stock: 12,
            features: "12,000 BTU, Inverter, filtro purificador",
        },
        {
            id: "6",
            name: "Licuadora de Alto Rendimiento",
            category: "Cocina",
            brand: "Oster",
            model: "BLSTMB-CBF-000",
            price: "$129.99",
            stock: 25,
            features: "1000W, jarra de vidrio 6 tazas, 7 velocidades",
        },
    ]

    // Filter products based on search term and category
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.model.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Categories for filter
    const categories = [
        { id: "all", name: "Todos" },
        { id: "refrigeración", name: "Refrigeración" },
        { id: "lavado", name: "Lavado" },
        { id: "televisores", name: "Televisores" },
        { id: "cocina", name: "Cocina" },
        { id: "climatización", name: "Climatización" },
    ]

    useEffect(() => {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem("isLoggedIn")
        if (!isLoggedIn) {
            router.push("/login")
        }
    }, [router])

    const handleImport = () => {
        setIsImporting(true)

        // Simulate import process
        setTimeout(() => {
            setIsImporting(false)
        }, 1500)
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    return (
        <div className="flex h-screen bg-white">
            <ChatSidebar isOpen={isSidebarOpen} activeMenu="pymes" />

            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <ChatHeader toggleSidebar={toggleSidebar} />

                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-[#160f41]">Catálogo de Productos</h1>
                            </div>

                            <div className="mt-2 md:mt-0 flex flex-col sm:flex-row gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 w-full sm:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e]"
                                    />
                                </div>

                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 w-full sm:w-40 border border-gray-300 rounded-md focus:outline-none focus:ring-[#d2006e] focus:border-[#d2006e] appearance-none bg-white"
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => handleImport()}
                                    disabled={isImporting}
                                    className="flex items-center justify-center gap-1 py-1 px-3 bg-[#d2006e] text-white text-xs rounded hover:bg-[#b00058] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isImporting? (
                                        <>
                                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Importando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-3 w-3" />
                                            <span>Importar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-4 text-center">
                                <p className="text-gray-600">No se encontraron productos que coincidan con su búsqueda.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-white uppercase bg-[#160f41]">
                                        <tr>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3">Categoría</th>
                                            <th className="px-4 py-3">Marca</th>
                                            <th className="px-4 py-3">Modelo</th>
                                            <th className="px-4 py-3">Precio</th>
                                            <th className="px-4 py-3">Stock</th>
                                            <th className="px-4 py-3">Características</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredProducts.map((product, index) => (
                                            <tr key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{product.category}</td>
                                                <td className="px-4 py-3 text-gray-600">{product.brand}</td>
                                                <td className="px-4 py-3 text-gray-600">{product.model}</td>
                                                <td className="px-4 py-3 font-medium text-[#d2006e]">{product.price}</td>
                                                <td className="px-4 py-3">
                            <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                    product.stock > 10
                                        ? "bg-green-100 text-green-800"
                                        : product.stock > 0
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                }`}
                            >
                              {product.stock > 10
                                  ? `${product.stock} disponibles`
                                  : product.stock > 0
                                      ? `${product.stock} restantes`
                                      : "Agotado"}
                            </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{product.features}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

