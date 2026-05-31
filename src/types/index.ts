export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// 백엔드 PaymentMethod enum
export type PaymentMethod = 'CARD' | 'MOBILE' | 'BANK_TRANSFER'

// 백엔드 PaymentStatus enum
export type PaymentStatus = 'PAID' | 'CANCELLED' | 'PARTIAL_CANCELLED'

// POST /api/v1/payments 요청
export interface PaymentRequest {
  merchantId: string
  merchantOrderId: string
  amount: number
  paymentMethod: PaymentMethod
  orderName?: string
}

// POST /api/v1/payments, /cancel, GET /payments/{id} 응답
export interface PaymentResponse {
  merchantOrderId: string
  txId: string
  paymentMethod: PaymentMethod
  paidAmount: number
  cancelledAmount: number
  paymentStatus: PaymentStatus
  createdAt: string
}

// POST /api/v1/payments/cancel 요청
export interface PaymentCancelRequest {
  merchantOrderId: string
  reason: string
  amount?: number
}

export interface WebhookLog {
  id: string
  txId: string
  merchantOrderId: string
  status: string
  receivedAt: string
}

export interface Product {
  id: number
  name: string
  price: number
  description: string
  emoji: string
}

export type PGProvider = 'html5_inicis' | 'kakaopay' | 'tosspayments' | 'danal' | 'danal_tpay'

export interface PGOption {
  id: PGProvider
  label: string
  description: string
  color: string
  payMethod: string
  paymentMethod: PaymentMethod
}
