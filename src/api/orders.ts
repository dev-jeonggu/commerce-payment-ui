/** 가맹점 주문번호 생성 (백엔드에 별도 주문 API 없음) */
export const generateMerchantOrderId = (): string => {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `ORD-${date}-${rand}`
}
