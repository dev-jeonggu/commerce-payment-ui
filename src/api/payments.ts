import { apiClient } from './client'
import type { ApiResponse, PaymentRequest, PaymentResponse, PaymentCancelRequest } from '../types'

export const registerPayment = async (req: PaymentRequest) => {
  const res = await apiClient.post<ApiResponse<PaymentResponse>>('/api/v1/payments', req)
  return res.data
}

export const cancelPayment = async (req: PaymentCancelRequest) => {
  const res = await apiClient.post<ApiResponse<PaymentResponse>>('/api/v1/payments/cancel', req)
  return res.data
}

export const getPayment = async (merchantOrderId: string) => {
  const res = await apiClient.get<ApiResponse<PaymentResponse>>(`/api/v1/payments/${merchantOrderId}`)
  return res.data
}
