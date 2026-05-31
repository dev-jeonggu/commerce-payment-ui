import DocsLayout, { Callout, Step, H2, P, InlineCode } from '../components/DocsLayout'
import CodeBlock from '../components/CodeBlock'

export default function Tutorial() {
  return (
    <DocsLayout
      title="결제창 연동하기"
      description="가맹점 서버에서 PayCore API를 호출해 결제를 처리하는 전체 흐름을 구현합니다."
      prev={{ label: '퀵스타트', path: '/quickstart' }}
      next={{ label: '결제 요청 가이드', path: '/guide/payment' }}
    >
      <Callout type="info">
        PayCore가 PG 역할을 직접 수행합니다. 가맹점은 외부 PG SDK 연동 없이
        <strong> PayCore API 하나만 호출하면 결제가 처리됩니다.</strong>
      </Callout>

      <H2>전체 흐름</H2>
      <CodeBlock
        language="text"
        code={`[고객 브라우저]       [가맹점 서버]          [PayCore (PG)]
      │                     │                     │
      │── 구매 요청 ────────>│                     │
      │                     │── POST /payments ──>│
      │                     │                     │── 결제 처리 (내부)
      │                     │<── PaymentResponse ─│  txId, PAID 반환
      │<── 결제 완료 ────────│                     │
      │                     │<── Webhook 알림 ─────│`}
      />

      <Callout type="tip">
        고객의 카드 정보는 PayCore 내부에서만 처리되며 가맹점 서버에 저장되지 않습니다.
      </Callout>

      <H2>단계별 구현</H2>

      <div className="space-y-0 mt-8">
        <Step number={1} title="가맹점 등록">
          <P>
            결제 API를 호출하려면 가맹점 ID와 Secret Key가 필요합니다.
            <InlineCode>POST /api/v1/merchants</InlineCode>로 등록하면 자동 발급됩니다.
          </P>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://jeonggu.store/api/v1/merchants \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchantId":    "my-shop",
    "webhookUrl":    "https://my-shop.com/webhook/payment",
    "webhookSecret": "my-strong-secret"
  }'`}
          />
          <CodeBlock
            language="json"
            title="응답"
            code={`{
  "success": true,
  "data": {
    "merchantId": "my-shop",
    "secretKey":  "자동발급된-SecretKey"
  }
}`}
          />
          <Callout type="warning">
            샌드박스에서는 이미 <InlineCode>test-merchant</InlineCode> / <InlineCode>test-secret-key-paycore</InlineCode>가
            생성되어 있습니다. 별도 등록 없이 바로 사용하세요.
          </Callout>
        </Step>

        <Step number={2} title="결제 요청">
          <P>
            고객이 결제 버튼을 누르면 가맹점 서버에서 <InlineCode>POST /api/v1/payments</InlineCode>를 호출합니다.
            가맹점은 금액과 결제 수단만 전달하면 됩니다.
          </P>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://jeonggu.store/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "X-Merchant-Id: test-merchant" \\
  -H "X-Api-Key: test-secret-key-paycore" \\
  -d '{
    "merchantId":      "test-merchant",
    "merchantOrderId": "ORD-20260531-00001",
    "amount":          30000,
    "paymentMethod":   "CARD",
    "orderName":       "MacBook Air M3"
  }'`}
          />
          <CodeBlock
            language="json"
            title="응답"
            code={`{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-00001",
    "txId":            "pg_tx_abc123",
    "paymentMethod":   "CARD",
    "paidAmount":      30000,
    "cancelledAmount": 0,
    "paymentStatus":   "PAID",
    "createdAt":       "2026-05-31T12:00:00"
  }
}`}
          />
        </Step>

        <Step number={3} title="결제 확인 (서버 사이드)">
          <P>
            결제 완료 후 고객에게 결과를 보여주기 전에,
            서버에서 결제 상태를 한 번 더 조회해 확인하는 것을 권장합니다.
          </P>
          <CodeBlock
            language="javascript"
            title="가맹점 서버 (Node.js 예시)"
            code={`app.post('/checkout', async (req, res) => {
  const { orderId, amount, method } = req.body

  // PayCore에 결제 요청
  const response = await fetch('https://jeonggu.store/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'X-Merchant-Id': process.env.PAYCORE_MERCHANT_ID,
      'X-Api-Key':     process.env.PAYCORE_SECRET_KEY,
      // 멱등성: 네트워크 재시도 시 중복 결제 방지
      'X-Idempotency-Key': orderId,
    },
    body: JSON.stringify({
      merchantId:      process.env.PAYCORE_MERCHANT_ID,
      merchantOrderId: orderId,
      amount,
      paymentMethod:   method,  // 'CARD' | 'MOBILE' | 'BANK_TRANSFER'
      orderName:       '주문명',
    }),
  })

  const { success, data } = await response.json()

  if (!success) {
    return res.status(400).json({ error: '결제 실패' })
  }

  // DB에 결제 완료 기록
  await db.orders.update({ orderId }, { status: 'PAID', txId: data.txId })
  res.json({ success: true, payment: data })
})`}
          />
        </Step>

        <Step number={4} title="Webhook 수신">
          <P>
            결제 완료, 가상계좌 입금 등의 이벤트가 발생하면 PayCore가
            가맹점의 <InlineCode>webhookUrl</InlineCode>로 자동 알림을 보냅니다.
          </P>
          <CodeBlock
            language="javascript"
            title="Webhook 수신 서버"
            code={`app.post('/webhook/payment', express.json(), (req, res) => {
  const signature = req.headers['x-webhook-secret']

  // 1. Secret 검증 (위변조 방지)
  if (signature !== process.env.WEBHOOK_SECRET) {
    return res.status(401).end()
  }

  const { status, merchantOrderId, amount } = req.body

  // 2. 상태별 처리
  switch (status) {
    case 'paid':
      await db.orders.update({ merchantOrderId }, { status: 'PAID' })
      break
    case 'cancelled':
      await db.orders.update({ merchantOrderId }, { status: 'CANCELLED' })
      break
    case 'deposited':              // 가상계좌 입금 확인
      await db.orders.update({ merchantOrderId }, { status: 'PAID' })
      break
  }

  // 3. 항상 200 반환 (멱등성 보장)
  res.status(200).end()
})`}
          />
          <Callout type="info">
            PayCore는 Webhook 실패 시 자동 재시도합니다.
            가맹점 서버가 200을 반환하지 않으면 최대 3회 재시도하며,
            이후에도 실패하면 Dead Letter Queue에 저장해 별도 복구합니다.
          </Callout>
        </Step>

        <Step number={5} title="결제 취소 · 환불">
          <P>
            전액 또는 부분 취소를 <InlineCode>POST /api/v1/payments/cancel</InlineCode>로 처리합니다.
          </P>
          <CodeBlock
            language="javascript"
            code={`// 전액 취소
await fetch('https://jeonggu.store/api/v1/payments/cancel', {
  method: 'POST',
  headers: {
    'Content-Type':  'application/json',
    'X-Merchant-Id': process.env.PAYCORE_MERCHANT_ID,
    'X-Api-Key':     process.env.PAYCORE_SECRET_KEY,
  },
  body: JSON.stringify({
    merchantOrderId: 'ORD-20260531-00001',
    reason: '고객 요청',
    // amount: 10000  // 부분 취소 시 금액 지정
  }),
})`}
          />
        </Step>
      </div>

      <H2>다음 단계</H2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {[
          { title: '샌드박스에서 직접 테스트', desc: 'API를 실제로 호출해서 응답을 확인하세요.', path: '/sandbox' },
          { title: 'Webhook 연동 가이드', desc: '가상계좌 입금, 취소 알림 처리 방법', path: '/guide/webhook' },
          { title: '가상계좌 발급', desc: '무통장 입금 처리 연동 방법', path: '/guide/virtual-account' },
          { title: '정기결제 (빌링키)', desc: '구독·월정액 자동결제 연동', path: '/guide/billing' },
        ].map((item) => (
          <a key={item.path} href={item.path} className="p-4 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900 transition-all">
            <p className="font-medium text-white text-sm mb-1">{item.title}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </a>
        ))}
      </div>
    </DocsLayout>
  )
}
