export interface ApiResponse<T> {
  code?: number
  message?: string
  data: T
}

export interface ErrorResponse {
  code?: number
  message?: string
  data?: unknown
}

export interface Slice<T> {
  content: T[]
  last: boolean
  number: number
  size: number
  numberOfElements: number
  first: boolean
  empty: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export interface PaginationParams {
  page: number
  size: number
  filter?: string | null
}
