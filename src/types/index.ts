export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface OrderCreateRequest {
  userId: number
  itemId: number
  amount: number
}

export interface OrderCreateResponse {
  orderNo: string
  status: OrderStatus
  totalAmount: number
  createdAt: string | number[]
}

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED'
export type PaymentStatus = 'PAID' | 'CANCELLED' | 'PARTIAL_CANCELLED'

export interface PaymentVerifyRequest {
  imp_uid: string
  merchant_uid: string
}

export interface PaymentResponse {
  orderNo: string
  orderStatus: OrderStatus
  impUid: string
  payMethod: string
  paidAmount: number
  cancelledAmount: number
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface PaymentCancelRequest {
  merchant_uid: string
  reason: string
  amount?: number
}

export interface WebhookLog {
  id: string
  impUid: string
  merchantUid: string
  status: string
  receivedAt: string
  trusted: boolean
  verified: boolean
}

export interface Product {
  id: number
  itemId: number
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
}
