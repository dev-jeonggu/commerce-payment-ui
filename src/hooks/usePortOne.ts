import { useCallback } from 'react'
import type { PGProvider } from '../types'

declare global {
  interface Window {
    IMP: {
      init: (code: string) => void
      request_pay: (params: object, callback: (rsp: ImpRsp) => void) => void
    }
  }
}

interface ImpRsp {
  success: boolean
  imp_uid?: string
  merchant_uid?: string
  pay_method?: string
  paid_amount?: number
  error_msg?: string
}

const IMP_CODE = import.meta.env.VITE_IMP_CODE || 'imp00000000'

interface PaymentRequest {
  pg: PGProvider
  pay_method: string
  merchant_uid: string
  name: string
  amount: number
  buyer_email?: string
  buyer_name?: string
  buyer_tel?: string
}

interface PaymentResult {
  imp_uid: string
  merchant_uid: string
  pay_method: string
  paid_amount: number
}

export const usePortOne = () => {
  const isLoaded = typeof window !== 'undefined' && !!window.IMP

  const requestPayment = useCallback((req: PaymentRequest): Promise<PaymentResult> => {
    return new Promise((resolve, reject) => {
      if (!window.IMP) {
        reject(new Error('PortOne SDK가 로드되지 않았습니다. 페이지를 새로고침해 주세요.'))
        return
      }
      window.IMP.init(IMP_CODE)
      window.IMP.request_pay(req, (rsp: ImpRsp) => {
        if (rsp.success && rsp.imp_uid && rsp.merchant_uid) {
          resolve({
            imp_uid: rsp.imp_uid,
            merchant_uid: rsp.merchant_uid,
            pay_method: rsp.pay_method ?? '',
            paid_amount: rsp.paid_amount ?? 0,
          })
        } else {
          reject(new Error(rsp.error_msg || '결제가 취소되었습니다.'))
        }
      })
    })
  }, [])

  return { isLoaded, requestPayment }
}
