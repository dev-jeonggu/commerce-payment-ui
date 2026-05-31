import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Code2, Key, Zap, ArrowRight, CheckCircle, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

const SECTIONS = ['시작하기', 'API 레퍼런스', '코드 예제', '에러 코드']

const API_ENDPOINTS = [
  {
    method: 'POST', path: '/api/v1/merchants', auth: '없음', tag: '가맹점',
    desc: '가맹점을 등록하고 Merchant ID / Secret Key를 발급받습니다.',
    request: `{
  "merchantId": "my-shop",
  "webhookUrl": "https://my-shop.com/webhook",
  "webhookSecret": "my-webhook-secret"
}`,
    response: `{
  "success": true,
  "data": {
    "merchantId": "my-shop",
    "secretKey": "자동발급된-SecretKey"
  }
}`,
  },
  {
    method: 'POST', path: '/api/v1/payments', auth: 'X-Merchant-Id + X-Api-Key', tag: '결제',
    desc: 'PG 결제 완료 후 백엔드에 결제를 등록합니다. 분산락·멱등성 자동 적용.',
    request: `{
  "merchantId": "my-shop",
  "merchantOrderId": "ORD-20260531-ABC12",
  "amount": 30000,
  "paymentMethod": "CARD",
  "orderName": "MacBook Air M3"
}`,
    response: `{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-ABC12",
    "txId": "pg_tx_abc123",
    "paymentMethod": "CARD",
    "paidAmount": 30000,
    "cancelledAmount": 0,
    "paymentStatus": "PAID",
    "createdAt": "2026-05-31T12:00:00"
  }
}`,
  },
  {
    method: 'GET', path: '/api/v1/payments/{merchantOrderId}', auth: 'X-Merchant-Id + X-Api-Key', tag: '결제',
    desc: '주문번호로 결제 정보를 조회합니다.',
    request: `// 헤더만 필요
X-Merchant-Id: my-shop
X-Api-Key: your-secret-key`,
    response: `{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-ABC12",
    "paymentStatus": "PAID",
    "paidAmount": 30000,
    ...
  }
}`,
  },
  {
    method: 'POST', path: '/api/v1/payments/cancel', auth: 'X-Merchant-Id + X-Api-Key', tag: '결제',
    desc: '전액 또는 부분 취소. amount 미입력 시 전액 취소.',
    request: `{
  "merchantOrderId": "ORD-20260531-ABC12",
  "reason": "고객 요청",
  "amount": 10000
}`,
    response: `{
  "success": true,
  "data": {
    "paymentStatus": "PARTIAL_CANCELLED",
    "cancelledAmount": 10000,
    ...
  }
}`,
  },
  {
    method: 'POST', path: '/api/v1/virtual-accounts', auth: 'X-Merchant-Id + X-Api-Key', tag: '가상계좌',
    desc: '가상계좌를 발급합니다. 입금 확인은 Webhook으로 수신됩니다.',
    request: `{
  "merchantId": "my-shop",
  "merchantOrderId": "ORD-20260531-VA001",
  "amount": 50000,
  "bankCode": "004",
  "holderName": "홍길동"
}`,
    response: `{
  "success": true,
  "data": {
    "txId": "va_tx_xyz789",
    "bankCode": "004",
    "accountNumber": "1234567890",
    "amount": 50000,
    "status": "ISSUED",
    "expiredAt": "2026-06-07T23:59:59"
  }
}`,
  },
  {
    method: 'POST', path: '/api/v1/billing-keys', auth: 'X-Merchant-Id + X-Api-Key', tag: '정기결제',
    desc: '빌링키를 등록합니다. PG사 customer_uid 기반으로 AES-256 암호화 저장.',
    request: `{
  "merchantId": "my-shop",
  "customerId": "customer-001",
  "pgBillingKey": "customer_abc123"
}`,
    response: `{
  "success": true,
  "data": {
    "id": 1,
    "customerId": "customer-001",
    "createdAt": "2026-05-31T12:00:00"
  }
}`,
  },
]

const CODE_EXAMPLES = {
  '결제 요청 (JavaScript)': `// 1. PortOne SDK로 PG 결제창 오픈
const IMP = window.IMP
IMP.init('imp52066388') // PortOne 가맹점 코드

const orderId = \`ORD-\${Date.now()}\`

IMP.request_pay({
  pg: 'tosspayments',      // PG사: tosspayments, kakaopay, danal, danal_tpay
  pay_method: 'card',
  merchant_uid: orderId,   // 고유 주문번호
  name: '상품명',
  amount: 30000,
  buyer_email: 'user@email.com',
  buyer_name: '홍길동',
}, async (rsp) => {
  if (!rsp.success) return alert(rsp.error_msg)

  // 2. PG 결제 완료 → 백엔드 등록
  const res = await fetch('/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Id': 'my-shop',
      'X-Api-Key': 'your-secret-key',
    },
    body: JSON.stringify({
      merchantId: 'my-shop',
      merchantOrderId: orderId,
      amount: 30000,
      paymentMethod: 'CARD',
      orderName: '상품명',
    }),
  })

  const data = await res.json()
  if (data.success) console.log('결제 완료:', data.data)
})`,

  '결제 취소 (JavaScript)': `const res = await fetch('/api/v1/payments/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Merchant-Id': 'my-shop',
    'X-Api-Key': 'your-secret-key',
  },
  body: JSON.stringify({
    merchantOrderId: 'ORD-1234567890',
    reason: '고객 요청',
    amount: 10000,  // 부분취소. 생략 시 전액취소
  }),
})

const data = await res.json()
// paymentStatus: 'CANCELLED' | 'PARTIAL_CANCELLED'`,

  'Webhook 수신 (Spring Boot)': `@PostMapping("/webhook/payment")
public ResponseEntity<Void> receiveWebhook(
    @RequestHeader("X-Webhook-Secret") String secret,
    @RequestBody WebhookPayload payload) {

  // 1. Secret 검증
  if (!myWebhookSecret.equals(secret)) {
    return ResponseEntity.status(401).build()
  }

  // 2. 결제 상태에 따른 처리
  switch (payload.getStatus()) {
    case "paid"    -> orderService.confirmPayment(payload.getMerchantOrderId())
    case "cancelled" -> orderService.cancelOrder(payload.getMerchantOrderId())
    case "partial_cancelled" -> orderService.partialCancel(payload)
  }

  // 3. 멱등성: 항상 200 반환 (중복 수신 허용)
  return ResponseEntity.ok().build()
}`,
}

const ERROR_CODES = [
  { code: 'MERCHANT_NOT_FOUND', status: 401, desc: '존재하지 않는 가맹점 ID' },
  { code: 'INVALID_API_KEY', status: 401, desc: 'X-Api-Key 불일치' },
  { code: 'MERCHANT_SUSPENDED', status: 403, desc: '정지된 가맹점' },
  { code: 'PAYMENT_ALREADY_PROCESSED', status: 409, desc: '동일 merchantOrderId 중복 결제' },
  { code: 'PAYMENT_NOT_FOUND', status: 404, desc: '결제 정보 없음' },
  { code: 'CANCEL_AMOUNT_EXCEEDED', status: 400, desc: '취소금액이 결제금액 초과' },
  { code: 'PAYMENT_METHOD_NOT_SUPPORTED', status: 400, desc: '가상계좌는 /virtual-accounts 사용' },
]

export default function Developers() {
  const [activeSection, setActiveSection] = useState('시작하기')
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState(Object.keys(CODE_EXAMPLES)[0])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-4">
          <Terminal size={12} />개발자 센터
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">PayCore API 문서</h1>
        <p className="text-gray-400 text-lg">가맹점 등록부터 결제·취소·Webhook까지, 연동에 필요한 모든 것.</p>
      </div>

      <div className="flex gap-8">
        {/* 사이드 네비 */}
        <nav className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === s ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
            <div className="pt-4 border-t border-gray-800 mt-4">
              <Link to="/sandbox" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Zap size={12} />샌드박스 테스트
              </Link>
            </div>
          </div>
        </nav>

        {/* 본문 */}
        <div className="flex-1 min-w-0 space-y-12">

          {/* 시작하기 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap size={20} className="text-blue-400" />시작하기
            </h2>
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                  가맹점 등록 및 인증 키 발급
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">POST /api/v1/merchants</code>로 가맹점을 등록하면
                  <strong className="text-white"> Merchant ID</strong>와 <strong className="text-white">Secret Key</strong>가 자동 발급됩니다.
                </p>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                  샌드박스에서는 <code>test-merchant</code> / <code>test-secret-key-paycore</code>가 자동으로 생성됩니다.
                  별도 등록 없이 바로 테스트하세요.
                </div>
              </div>

              <div className="p-5 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                  요청 헤더 설정
                </h3>
                <div className="font-mono text-sm space-y-2">
                  {[
                    { key: 'X-Merchant-Id', val: 'test-merchant', desc: '가맹점 식별자' },
                    { key: 'X-Api-Key', val: 'test-secret-key-paycore', desc: '시크릿 키' },
                    { key: 'Content-Type', val: 'application/json', desc: '' },
                    { key: 'X-Idempotency-Key', val: 'unique-key-001', desc: '멱등성 키 (선택)' },
                  ].map((h) => (
                    <div key={h.key} className="flex items-center gap-3">
                      <span className="text-blue-400 w-48 shrink-0">{h.key}</span>
                      <span className="text-emerald-400">{h.val}</span>
                      {h.desc && <span className="text-gray-600 text-xs">// {h.desc}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                  지원 결제 수단
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { method: 'CARD', desc: '신용·체크카드', icon: '💳' },
                    { method: 'MOBILE', desc: '휴대폰 소액결제', icon: '📱' },
                    { method: 'VIRTUAL_ACCOUNT', desc: '가상계좌', icon: '🏦' },
                    { method: 'BANK_TRANSFER', desc: '계좌이체', icon: '🔄' },
                  ].map((m) => (
                    <div key={m.method} className="bg-gray-950 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <code className="text-xs text-blue-400 block">{m.method}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* API 레퍼런스 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Code2 size={20} className="text-blue-400" />API 레퍼런스
            </h2>
            <div className="space-y-3">
              {API_ENDPOINTS.map((ep) => {
                const key = ep.method + ep.path
                const isOpen = openEndpoint === key
                return (
                  <div key={key} className={`rounded-xl border transition-colors ${isOpen ? 'border-blue-500/40 bg-blue-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
                    <button
                      onClick={() => setOpenEndpoint(isOpen ? null : key)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <span className={`text-xs font-bold px-2 py-1 rounded font-mono ${
                        ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{ep.method}</span>
                      <code className="text-sm text-white font-mono flex-1">{ep.path}</code>
                      <span className="text-xs text-gray-600 hidden sm:inline">{ep.auth}</span>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{ep.tag}</span>
                      {isOpen ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-4">
                        <p className="text-sm text-gray-400">{ep.desc}</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Request</p>
                            <CodeBlock code={ep.request} language="json" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response</p>
                            <CodeBlock code={ep.response} language="json" />
                          </div>
                        </div>
                        {ep.auth !== '없음' && (
                          <div className="flex items-center gap-2 text-xs text-amber-400">
                            <Key size={11} />
                            인증 필요: {ep.auth}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* 코드 예제 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Terminal size={20} className="text-blue-400" />코드 예제
            </h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              {Object.keys(CODE_EXAMPLES).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveExample(k)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeExample === k ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <CodeBlock code={CODE_EXAMPLES[activeExample as keyof typeof CODE_EXAMPLES]} language="javascript" />
          </section>

          {/* 에러 코드 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">에러 코드</h2>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">에러 코드</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">HTTP</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {ERROR_CODES.map((e) => (
                    <tr key={e.code} className="bg-gray-900/30 hover:bg-gray-900/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-rose-400 text-xs">{e.code}</td>
                      <td className="px-4 py-3 text-gray-400">{e.status}</td>
                      <td className="px-4 py-3 text-gray-300">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 샌드박스 CTA */}
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                직접 API를 호출해보고 싶다면?
              </h3>
              <p className="text-sm text-gray-400">샌드박스에서 실제 결제 요청·취소를 테스트할 수 있습니다.</p>
            </div>
            <Link to="/sandbox" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors whitespace-nowrap ml-4">
              샌드박스 열기 <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
