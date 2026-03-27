export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    hasMore: boolean
    nextCursor: string | null
    prevCursor: string | null
    total?: number
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
