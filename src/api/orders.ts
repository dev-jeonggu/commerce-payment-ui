import { apiClient } from './client'
import type { ApiResponse, OrderCreateRequest, OrderCreateResponse } from '../types'

export const createOrder = async (req: OrderCreateRequest) => {
  const res = await apiClient.post<ApiResponse<OrderCreateResponse>>('/api/v1/orders', req)
  return res.data
}
