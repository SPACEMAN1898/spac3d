export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor?: string | null
  prevCursor?: string | null
}
