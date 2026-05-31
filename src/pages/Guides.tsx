import { useParams } from 'react-router-dom'
import DocsLayout, { Callout, H2, H3, P, InlineCode, Table } from '../components/DocsLayout'
import CodeBlock from '../components/CodeBlock'

// ─── 결제 요청 가이드 ──────────────────────────────────────────
function PaymentGuide() {
  return (
    <DocsLayout
      title="결제 요청"
      description="POST /api/v1/payments — 가맹점 서버에서 호출하면 PayCore가 결제를 직접 처리하고 결과를 반환합니다."
      prev={{ label: '결제창 연동 튜토리얼', path: '/tutorial' }}
      next={{ label: '결제 취소 · 환불', path: '/guide/cancel' }}
    >
      <Callout type="warning">
        가상계좌는 이 엔드포인트를 사용하지 않습니다.
        <InlineCode>POST /api/v1/virtual-accounts</InlineCode>를 사용하세요.
      </Callout>

      <H2>요청</H2>
      <Table
        headers={['파라미터', '타입', '필수', '설명']}
        rows={[
          ['merchantId',      'string',  '✓', '가맹점 식별자'],
          ['merchantOrderId', 'string',  '✓', '가맹점 주문번호 (유일값)'],
          ['amount',          'number',  '✓', '결제 금액 (원 단위)'],
          ['paymentMethod',   'enum',    '✓', 'CARD | MOBILE | BANK_TRANSFER'],
          ['orderName',       'string',  '',  '주문명 (선택)'],
        ]}
      />

      <H3>요청 헤더</H3>
      <CodeBlock
        language="http"
        code={`POST /api/v1/payments HTTP/1.1
X-Merchant-Id: test-merchant
X-Api-Key: test-secret-key-paycore
Content-Type: application/json
X-Idempotency-Key: ORD-20260531-ABC12  // 선택: 멱등성 키`}
      />

      <H3>요청 본문</H3>
      <CodeBlock
        language="json"
        code={`{
  "merchantId":      "test-merchant",
  "merchantOrderId": "ORD-20260531-ABC12",
  "amount":          30000,
  "paymentMethod":   "CARD",
  "orderName":       "MacBook Air M3"
}`}
      />

      <H2>응답</H2>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-ABC12",
    "txId":            "pg_tx_abc123",
    "paymentMethod":   "CARD",
    "paidAmount":      30000,
    "cancelledAmount": 0,
    "paymentStatus":   "PAID",
    "createdAt":       "2026-05-31T12:00:00"
  }
}`}
      />

      <H2>에러 케이스</H2>
      <Table
        headers={['에러 코드', 'HTTP', '원인']}
        rows={[
          ['MERCHANT_NOT_FOUND',        '401', 'X-Merchant-Id가 존재하지 않음'],
          ['INVALID_API_KEY',           '401', 'X-Api-Key 불일치'],
          ['PAYMENT_ALREADY_PROCESSED', '409', '동일 merchantOrderId로 이미 결제됨'],
          ['PAYMENT_METHOD_NOT_SUPPORTED','400','paymentMethod가 VIRTUAL_ACCOUNT인 경우'],
        ]}
      />

      <H2>중복 결제 방지</H2>
      <P>
        PayCore는 Redis 분산락을 사용해 동일 주문번호에 대한 동시 요청을 직렬화합니다.
        네트워크 재시도 등으로 동일 요청이 여러 번 들어와도 한 번만 처리됩니다.
      </P>
      <CodeBlock
        language="text"
        title="분산락 흐름"
        code={`요청 1 ──> 락 획득 성공 ──> 결제 처리 ──> 락 해제
요청 2 ──> 락 대기 (최대 5초) ──> 락 획득 ──> PAYMENT_ALREADY_PROCESSED 반환`}
      />
    </DocsLayout>
  )
}

// ─── 결제 취소 가이드 ──────────────────────────────────────────
function CancelGuide() {
  return (
    <DocsLayout
      title="결제 취소 · 환불"
      description="POST /api/v1/payments/cancel — 전액 또는 부분 취소를 처리합니다."
      prev={{ label: '결제 요청', path: '/guide/payment' }}
      next={{ label: 'Webhook 연동', path: '/guide/webhook' }}
    >
      <H2>요청</H2>
      <Table
        headers={['파라미터', '타입', '필수', '설명']}
        rows={[
          ['merchantOrderId', 'string', '✓', '취소할 주문번호'],
          ['reason',          'string', '✓', '취소 사유'],
          ['amount',          'number', '',  '부분 취소 금액. 생략 시 전액 취소'],
        ]}
      />

      <CodeBlock
        language="json"
        title="전액 취소"
        code={`{
  "merchantOrderId": "ORD-20260531-ABC12",
  "reason": "고객 요청"
}`}
      />

      <CodeBlock
        language="json"
        title="부분 취소 (10,000원)"
        code={`{
  "merchantOrderId": "ORD-20260531-ABC12",
  "reason": "일부 상품 반품",
  "amount": 10000
}`}
      />

      <H2>응답 — 취소 상태</H2>
      <Table
        headers={['paymentStatus', '설명']}
        rows={[
          ['CANCELLED',          '전액 취소 완료'],
          ['PARTIAL_CANCELLED',  '부분 취소 완료. cancelledAmount 필드 확인'],
        ]}
      />

      <CodeBlock
        language="json"
        title="부분 취소 응답"
        code={`{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-ABC12",
    "paymentStatus":   "PARTIAL_CANCELLED",
    "paidAmount":      30000,
    "cancelledAmount": 10000,
    ...
  }
}`}
      />

      <Callout type="danger">
        취소 금액이 결제 금액을 초과하면 <InlineCode>CANCEL_AMOUNT_EXCEEDED</InlineCode> 에러가 반환됩니다.
        <InlineCode>paidAmount - cancelledAmount</InlineCode>를 먼저 확인하세요.
      </Callout>
    </DocsLayout>
  )
}

// ─── Webhook 가이드 ────────────────────────────────────────────
function WebhookGuide() {
  return (
    <DocsLayout
      title="Webhook 연동"
      description="결제 완료, 취소, 가상계좌 입금 등 비동기 이벤트를 실시간으로 수신합니다."
      prev={{ label: '결제 취소 · 환불', path: '/guide/cancel' }}
      next={{ label: '가상계좌', path: '/guide/virtual-account' }}
    >
      <Callout type="warning">
        Webhook 수신 내용만으로 결제를 확정하지 마세요.
        반드시 <InlineCode>GET /api/v1/payments/{'{merchantOrderId}'}</InlineCode>로 실제 상태를 재조회해야 합니다.
      </Callout>

      <H2>Webhook 페이로드</H2>
      <CodeBlock
        language="json"
        code={`{
  "txId":            "pg_tx_abc123",
  "merchantOrderId": "ORD-20260531-ABC12",
  "status":          "paid",
  "amount":          30000,
  "paymentMethod":   "CARD",
  "paidAt":          "2026-05-31T12:00:00"
}`}
      />

      <H2>status 값</H2>
      <Table
        headers={['status', '설명']}
        rows={[
          ['paid',              '결제 완료'],
          ['cancelled',         '전액 취소'],
          ['partial_cancelled', '부분 취소'],
          ['virtual_account_issued', '가상계좌 발급'],
          ['deposited',         '가상계좌 입금 확인'],
        ]}
      />

      <H2>수신 서버 구현 (Spring Boot)</H2>
      <CodeBlock
        language="java"
        code={`@PostMapping("/webhook/payment")
public ResponseEntity<Void> receiveWebhook(
    @RequestHeader("X-Webhook-Secret") String secret,
    @RequestBody WebhookPayload payload) {

  // 1. Secret 검증 — 타이밍 공격 방어를 위해 MessageDigest.isEqual 사용
  if (!MessageDigest.isEqual(
      myWebhookSecret.getBytes(), secret.getBytes())) {
    return ResponseEntity.status(401).build();
  }

  // 2. Webhook 내용 신뢰 금지 — API로 재조회
  PaymentResponse payment = paymentClient
      .getPayment(payload.getMerchantOrderId());

  // 3. 상태별 처리
  switch (payment.getPaymentStatus()) {
    case PAID -> orderService.confirm(payment.getMerchantOrderId());
    case CANCELLED -> orderService.cancel(payment.getMerchantOrderId());
    case PARTIAL_CANCELLED -> orderService.partialCancel(payment);
  }

  // 4. 항상 200 반환 (멱등성)
  return ResponseEntity.ok().build();
}`}
      />

      <H2>재시도 정책</H2>
      <P>
        PayCore는 가맹점 서버가 응답하지 않으면 최대 3회 재시도합니다.
        3회 모두 실패하면 <strong>Dead Letter Queue</strong>에 저장되고 별도 처리 스케줄러가 재발송합니다.
      </P>
      <P>
        추가로 <strong>5분 주기 스케줄러</strong>가 PENDING 상태인 결제를 자동으로 복구하므로
        Webhook이 유실되어도 결제 상태가 정합성을 잃지 않습니다.
      </P>

      <H3>Webhook 수신 엔드포인트 등록</H3>
      <CodeBlock
        language="json"
        title="POST /api/v1/merchants"
        code={`{
  "merchantId":    "my-shop",
  "webhookUrl":    "https://my-shop.com/webhook/payment",
  "webhookSecret": "my-strong-secret-key"
}`}
      />
    </DocsLayout>
  )
}

// ─── 가상계좌 가이드 ───────────────────────────────────────────
function VirtualAccountGuide() {
  return (
    <DocsLayout
      title="가상계좌"
      description="POST /api/v1/virtual-accounts — 가상계좌를 발급하고 입금 완료를 Webhook으로 수신합니다."
      prev={{ label: 'Webhook 연동', path: '/guide/webhook' }}
      next={{ label: '정기결제 (빌링키)', path: '/guide/billing' }}
    >
      <P>
        가상계좌는 고객에게 개인화된 계좌번호를 발급해 무통장 입금을 처리하는 결제 방식입니다.
        입금 완료 시 은행이 PayCore에 Webhook을 발송하고, PayCore는 가맹점에 다시 Webhook을 보냅니다.
      </P>

      <H2>발급 요청</H2>
      <CodeBlock
        language="json"
        title="POST /api/v1/virtual-accounts"
        code={`{
  "merchantId":      "test-merchant",
  "merchantOrderId": "ORD-VA-20260531-001",
  "amount":          50000,
  "bankCode":        "004",
  "holderName":      "홍길동"
}`}
      />

      <H2>응답</H2>
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "data": {
    "txId":          "va_tx_xyz789",
    "bankCode":      "004",
    "bankName":      "국민은행",
    "accountNumber": "1234567890",
    "amount":        50000,
    "status":        "ISSUED",
    "expiredAt":     "2026-06-07T23:59:59"
  }
}`}
      />

      <H2>상태 흐름</H2>
      <CodeBlock
        language="text"
        code={`ISSUED ──> (고객 입금) ──> DEPOSITED ──> 가맹점 Webhook 발송
       └─> (만료) ──> EXPIRED (10분 주기 스케줄러가 자동 처리)`}
      />

      <Callout type="info">
        <InlineCode>POST /api/v1/payments</InlineCode>에 <InlineCode>paymentMethod: "VIRTUAL_ACCOUNT"</InlineCode>를
        전달하면 에러가 반환됩니다. 가상계좌는 반드시 전용 엔드포인트를 사용해야 합니다.
      </Callout>

      <H2>은행 코드</H2>
      <Table
        headers={['bankCode', '은행명']}
        rows={[
          ['004', '국민은행'], ['011', '농협은행'], ['020', '우리은행'],
          ['081', '하나은행'], ['088', '신한은행'], ['003', '기업은행'],
        ]}
      />
    </DocsLayout>
  )
}

// ─── 빌링키 가이드 ─────────────────────────────────────────────
function BillingGuide() {
  return (
    <DocsLayout
      title="정기결제 (빌링키)"
      description="빌링키를 등록하고 주기적으로 자동 결제를 처리합니다."
      prev={{ label: '가상계좌', path: '/guide/virtual-account' }}
      next={{ label: 'REST API 레퍼런스', path: '/reference' }}
    >
      <P>
        빌링키는 고객의 결제 수단을 PayCore에 안전하게 등록해두고,
        이후 가맹점이 원하는 시점에 자동으로 결제를 처리하는 방식입니다.
        빌링키는 AES-256으로 암호화하여 저장됩니다.
      </P>

      <H2>빌링키 등록</H2>
      <CodeBlock
        language="json"
        title="POST /api/v1/billing-keys"
        code={`{
  "merchantId":   "test-merchant",
  "customerId":   "customer-001",
  "pgBillingKey": "customer_abc123"  // 고객 결제수단 식별키
}`}
      />

      <H2>빌링키로 결제</H2>
      <CodeBlock
        language="json"
        title="POST /api/v1/billing-keys/charge"
        code={`{
  "merchantId":      "test-merchant",
  "billingKeyId":    1,
  "merchantOrderId": "SUB-20260601-001",
  "amount":          9900,
  "orderName":       "월정액 구독"
}`}
      />

      <Callout type="tip">
        구독 서비스의 경우 매월 정해진 날에 이 API를 호출하면 됩니다.
        실패 시 재시도 로직은 직접 구현해야 합니다.
      </Callout>

      <H2>빌링키 삭제</H2>
      <CodeBlock
        language="http"
        code={`DELETE /api/v1/billing-keys/{id}
X-Merchant-Id: test-merchant
X-Api-Key: test-secret-key-paycore`}
      />
    </DocsLayout>
  )
}

// ─── API 레퍼런스 ──────────────────────────────────────────────
function Reference() {
  const endpoints = [
    { method: 'POST', path: '/api/v1/merchants', auth: '없음', desc: '가맹점 등록' },
    { method: 'GET',  path: '/api/v1/merchants/{id}', auth: 'Merchant', desc: '가맹점 조회' },
    { method: 'POST', path: '/api/v1/payments', auth: 'Merchant', desc: '결제 등록' },
    { method: 'GET',  path: '/api/v1/payments/{merchantOrderId}', auth: 'Merchant', desc: '결제 조회' },
    { method: 'POST', path: '/api/v1/payments/cancel', auth: 'Merchant', desc: '결제 취소' },
    { method: 'POST', path: '/api/v1/payments/webhook/bank', auth: 'Internal-Token', desc: '은행 입금 Webhook (내부)' },
    { method: 'POST', path: '/api/v1/virtual-accounts', auth: 'Merchant', desc: '가상계좌 발급' },
    { method: 'GET',  path: '/api/v1/virtual-accounts/{merchantOrderId}', auth: 'Merchant', desc: '가상계좌 조회' },
    { method: 'POST', path: '/api/v1/billing-keys', auth: 'Merchant', desc: '빌링키 등록' },
    { method: 'GET',  path: '/api/v1/billing-keys', auth: 'Merchant', desc: '빌링키 목록' },
    { method: 'POST', path: '/api/v1/billing-keys/charge', auth: 'Merchant', desc: '빌링키 결제' },
    { method: 'DELETE',path: '/api/v1/billing-keys/{id}', auth: 'Merchant', desc: '빌링키 삭제' },
  ]

  return (
    <DocsLayout
      title="REST API 레퍼런스"
      description="PayCore의 모든 API 엔드포인트 목록입니다."
      prev={{ label: '정기결제 (빌링키)', path: '/guide/billing' }}
    >
      <Callout type="info">
        Swagger UI에서 직접 API를 호출해볼 수 있습니다: <InlineCode>/swagger-ui.html</InlineCode>
      </Callout>

      <H2>Base URL</H2>
      <CodeBlock language="text" code={`https://jeonggu.store  (프로덕션 · Cloudflare Tunnel)
http://localhost:8080  (로컬 개발)`} />

      <H2>공통 인증 헤더</H2>
      <Table
        headers={['헤더', '값', '필수', '설명']}
        rows={[
          ['X-Merchant-Id',    'test-merchant',            '✓', '가맹점 식별자'],
          ['X-Api-Key',        'test-secret-key-paycore',  '✓', '시크릿 키'],
          ['X-Idempotency-Key','임의의 고유값',              '',  '멱등성 키 (권장)'],
          ['Content-Type',     'application/json',          '✓', ''],
        ]}
      />

      <H2>엔드포인트 목록</H2>
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium w-16">Method</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Endpoint</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">인증</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {endpoints.map((ep) => (
              <tr key={ep.method + ep.path} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold font-mono px-2 py-1 rounded ${
                    ep.method === 'GET'    ? 'bg-blue-500/20 text-blue-400' :
                    ep.method === 'POST'   ? 'bg-emerald-500/20 text-emerald-400' :
                    ep.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{ep.method}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-200">{ep.path}</td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{ep.auth}</td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{ep.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>공통 응답 포맷</H2>
      <CodeBlock
        language="json"
        code={`// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "message": "에러 메시지" }`}
      />
    </DocsLayout>
  )
}

// ─── 퀵스타트 ──────────────────────────────────────────────────
function Quickstart() {
  return (
    <DocsLayout
      title="퀵스타트"
      description="5분 안에 첫 결제를 연동하는 최소한의 코드입니다."
      prev={{ label: '개요', path: '/' }}
      next={{ label: '결제창 연동 튜토리얼', path: '/tutorial' }}
    >
      <Callout type="tip">
        샌드박스 환경에서는 가맹점 등록 없이 아래 고정 인증값을 바로 사용할 수 있습니다.
      </Callout>

      <CodeBlock
        language="bash"
        title="샌드박스 인증값"
        code={`X-Merchant-Id: test-merchant
X-Api-Key:     test-secret-key-paycore`}
      />

      <H2>1. 결제 요청</H2>
      <P>
        가맹점 서버에서 <InlineCode>POST /api/v1/payments</InlineCode>를 호출합니다.
        PayCore가 결제를 처리하고 결과를 바로 반환합니다. 별도 SDK 불필요.
      </P>
      <CodeBlock
        language="javascript"
        title="가맹점 서버 (Node.js)"
        code={`const orderId = 'ORD-' + Date.now()

const res = await fetch('https://jeonggu.store/api/v1/payments', {
  method: 'POST',
  headers: {
    'Content-Type':    'application/json',
    'X-Merchant-Id':   'test-merchant',
    'X-Api-Key':       'test-secret-key-paycore',
    'X-Idempotency-Key': orderId,  // 중복 결제 방지
  },
  body: JSON.stringify({
    merchantId:      'test-merchant',
    merchantOrderId: orderId,
    amount:          30000,
    paymentMethod:   'CARD',       // CARD | MOBILE | BANK_TRANSFER
    orderName:       '테스트 상품',
  }),
})

const { success, data } = await res.json()
// data.paymentStatus === 'PAID'
// data.txId           === 'CARD-XXXXXXXXXXXXXXXX'
console.log(data)`}
      />

      <H2>2. 결제 조회</H2>
      <CodeBlock
        language="javascript"
        code={`const res = await fetch('/api/v1/payments/' + orderId, {
  headers: {
    'X-Merchant-Id': 'test-merchant',
    'X-Api-Key': 'test-secret-key-paycore',
  },
})
const { data } = await res.json()
console.log(data.paymentStatus) // 'PAID'`}
      />

      <H2>3. 취소</H2>
      <CodeBlock
        language="javascript"
        code={`await fetch('/api/v1/payments/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Merchant-Id': 'test-merchant',
    'X-Api-Key': 'test-secret-key-paycore',
  },
  body: JSON.stringify({
    merchantOrderId: orderId,
    reason: '고객 요청',
    // amount: 5000  // 부분 취소 시 금액 지정
  }),
})`}
      />
    </DocsLayout>
  )
}

// ─── 라우터 ────────────────────────────────────────────────────
export default function GuideRouter() {
  const { guide } = useParams<{ guide: string }>()
  switch (guide) {
    case 'payment':         return <PaymentGuide />
    case 'cancel':          return <CancelGuide />
    case 'webhook':         return <WebhookGuide />
    case 'virtual-account': return <VirtualAccountGuide />
    case 'billing':         return <BillingGuide />
    default:                return <PaymentGuide />
  }
}

export { Quickstart, Reference }
