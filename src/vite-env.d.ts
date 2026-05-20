/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_IMP_CODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    IMP: {
      init: (code: string) => void
      request_pay: (params: object, callback: (rsp: ImpResponse) => void) => void
    }
  }
}

interface ImpResponse {
  success: boolean
  imp_uid?: string
  merchant_uid?: string
  pay_method?: string
  paid_amount?: number
  error_msg?: string
  error_code?: string
}
