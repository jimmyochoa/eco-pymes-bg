export interface Response {
    error: boolean
    code: number
    message: string
    data?: any | null
    errors?: any | null
}
