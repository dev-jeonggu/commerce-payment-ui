import { apiClient } from './client'
import type {
  ApiResponse,
  PaymentVerifyRequest,
  PaymentResponse,
  PaymentCancelRequest,
} from '../types'

export const verifyPayment = async (req: PaymentVerifyRequest) => {
  const res = await apiClient.post<ApiResponse<PaymentResponse>>('/api/v1/payments/verify', req)
  return res.data
}

export const cancelPayment = async (req: PaymentCancelRequest) => {
  const res = await apiClient.post<ApiResponse<PaymentResponse>>('/api/v1/payments/cancel', req)
  return res.data
}

export const getPayment = async (orderNo: string) => {
  const res = await apiClient.get<ApiResponse<PaymentResponse>>(`/api/v1/payments/${orderNo}`)
  return res.data
}

export const sendWebhook = async (impUid: string, merchantUid: string, status: string) => {
  const res = await apiClient.post<ApiResponse<void>>('/api/v1/payments/webhook', {
    imp_uid: impUid,
    merchant_uid: merchantUid,
    status,
  })
  return res.data
}
