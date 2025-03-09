export interface MessageType {
    id: string
    content: string
    role: "user" | "assistant"
    createdAt: Date
    productTable?: ProductType[] // Optional product table data
}

export interface ProductType {
    id: string
    nombre: string
    precio: string
    calificacionPago: number
    calificacionCompra: number
    recomendacionCredito: string
}