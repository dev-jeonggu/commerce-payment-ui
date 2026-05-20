import { useState } from 'react'
import { ChevronDown, ChevronRight, Code, AlertTriangle, CheckCircle, Lock } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

interface FlowStep {
  id: number
  actor: string
  title: string
  description: string
  detail: string
  keyPoints: string[]
  code?: string
  codeTitle?: string
  codeLanguage?: string
  type: 'client' | 'server' | 'pg' | 'webhook' | 'lock'
  important?: boolean
}

const STEPS: FlowStep[] = [
  {
    id: 1,
    actor: 'Client',
    title: '구매 버튼 클릭',
    description: '사용자가 결제 버튼을 클릭합니다.',
    detail: '프론트엔드에서 먼저 서버에 주문을 생성합니다. 이 단계에서 금액을 서버에 저장하는 것이 위변조 방지의 핵심입니다.',
    keyPoints: [
      '클라이언트 금액은 절대 신뢰하지 않음',
      '서버에서 상품 가격을 재조회하여 저장',
      'orderNo (merchant_uid)는 서버에서 UUID 기반 생성',
    ],
    code: `// 1. 주문 생성 (서버에 금액 저장)
const order = await fetch('/api/v1/orders', {
  method: 'POST',
  body: JSON.stringify({
    userId: 1,
    itemId: 10,
    amount: 30000  // 서버에서 재검증됨
  })
}).then(r => r.json())

// orderNo = "ORD-20260303-ABC123"`,
    codeTitle: 'Step 1: 주문 생성',
    codeLanguage: 'javascript',
    type: 'client',
  },
  {
    id: 2,
    actor: 'Server',
    title: '주문 생성 & 금액 저장',
    description: '서버가 주문을 PENDING 상태로 DB에 저장합니다.',
    detail: '이 단계가 보안의 핵심입니다. 서버는 요청받은 금액을 신뢰 기준으로 저장합니다. 이후 결제 검증 단계에서 PG 결제 금액과 이 금액을 비교합니다.',
    keyPoints: [
      'DB에 amount 저장 → 이것이 검증 기준',
      'orderNo를 PG 결제창의 merchant_uid로 사용',
      '주문 상태: PENDING',
    ],
    code: `// OrderService.java
public OrderCreateResponse createOrder(OrderCreateRequest req) {
  String orderNo = OrderNumberGenerator.generate(); // UUID 기반
  Order order = Order.builder()
      .orderNo(orderNo)
      .userId(req.getUserId())
      .amount(req.getAmount()) // DB에 저장 (검증 기준)
      .status(OrderStatus.PENDING)
      .build();
  return orderRepository.save(order);
}`,
    codeTitle: 'Step 2: OrderService.java',
    codeLanguage: 'java',
    type: 'server',
  },
  {
    id: 3,
    actor: 'Client → PG',
    title: 'PG 결제창 오픈',
    description: 'PortOne SDK를 통해 결제창을 띄웁니다.',
    detail: 'PortOne V1 SDK의 IMP.request_pay()를 호출합니다. 사용자가 결제창에서 카드 정보를 입력하면 PortOne이 PG사(이니시스, 카카오, 토스 등)와 통신합니다.',
    keyPoints: [
      'merchant_uid = 서버에서 생성한 orderNo',
      'amount는 UI 표시용이지 검증 기준 아님',
      'imp_uid = PG사가 발급하는 고유 결제번호',
    ],
    code: `// PortOne SDK 결제 요청
IMP.init("imp_가맹점식별코드");
IMP.request_pay({
  pg: "html5_inicis",      // PG사
  pay_method: "card",
  merchant_uid: orderNo,   // 서버에서 받은 주문번호
  name: "테스트 상품",
  amount: 30000,           // 표시용 (검증 기준 아님!)
  buyer_email: "test@test.com",
}, function(rsp) {
  if (rsp.success) {
    // imp_uid로 서버에 검증 요청
    verifyPayment(rsp.imp_uid, rsp.merchant_uid)
  }
})`,
    codeTitle: 'Step 3: PortOne SDK 호출',
    codeLanguage: 'javascript',
    type: 'pg',
  },
  {
    id: 4,
    actor: 'PG Server',
    title: '실제 결제 처리',
    description: 'PG 서버가 카드사와 통신하여 결제를 처리합니다.',
    detail: 'PortOne → KG이니시스/카카오/토스페이먼츠 → 카드사 순서로 통신합니다. 성공 시 imp_uid를 발급하고 프론트엔드로 리다이렉트합니다.',
    keyPoints: [
      'PortOne이 PG사와 통신 (카드 승인)',
      'imp_uid 발급 (PG사 고유 결제번호)',
      '결제 완료 후 콜백(redirect)으로 imp_uid 전달',
    ],
    type: 'pg',
    important: false,
  },
  {
    id: 5,
    actor: 'Client',
    title: 'imp_uid 수신 & 검증 요청',
    description: '결제 완료 후 imp_uid를 받아 서버에 검증을 요청합니다.',
    detail: '절대로 이 단계에서 결제 완료 처리를 하면 안 됩니다. imp_uid와 merchant_uid를 서버로 전송하여 서버가 PG API를 직접 조회하도록 해야 합니다.',
    keyPoints: [
      'imp_uid = PG사가 발급한 결제번호',
      '클라이언트가 받은 rsp 데이터를 그대로 신뢰 X',
      '반드시 서버에서 PG API로 재확인해야 함',
    ],
    code: `// 결제 검증 요청 (프론트 → 백엔드)
const result = await fetch('/api/v1/payments/verify', {
  method: 'POST',
  body: JSON.stringify({
    imp_uid: rsp.imp_uid,           // PG사 결제번호
    merchant_uid: rsp.merchant_uid  // 주문번호
  })
}).then(r => r.json())

if (result.success) {
  alert('결제 완료: ' + result.data.paidAmount + '원')
}`,
    codeTitle: 'Step 5: 검증 요청',
    codeLanguage: 'javascript',
    type: 'client',
  },
  {
    id: 6,
    actor: 'Server',
    title: '분산락 + 금액 검증',
    description: '서버에서 Redis 분산락 획득 후 PG API 단건 조회로 금액을 검증합니다.',
    detail: '이 단계가 시스템 전체에서 가장 중요합니다. 분산락으로 중복 처리를 막고, PG API를 직접 호출해 클라이언트 데이터를 전혀 신뢰하지 않으며, DB 금액과 PG 금액을 비교합니다.',
    keyPoints: [
      '① Redis 분산락 획득 (중복 요청 방지)',
      '② PortOne API로 imp_uid 단건 조회',
      '③ DB 주문 금액 vs PG 결제 금액 비교',
      '④ 불일치 시 즉시 PG 취소 + 예외 반환',
      '⑤ 일치 시 PAID 처리, 재고 차감, 포인트 적립',
    ],
    code: `// PaymentService.java - 핵심 검증 로직
public PaymentResponse verifyAndSavePayment(PaymentVerifyRequest req) {
  // 1. PG API 단건 조회 (클라이언트 신뢰 X)
  PortOnePaymentResponse pgPayment = portOneClient
      .getPaymentByImpUid(req.getImpUid());

  // 2. DB 금액 조회
  Order order = orderRepository
      .findByOrderNo(req.getMerchantUid())
      .orElseThrow(() -> new PaycoreException(ORDER_NOT_FOUND));

  // 3. 금액 비교 (위변조 방지 핵심)
  if (!order.getAmount().equals(pgPayment.getAmount())) {
    portOneClient.cancelPayment(...); // 즉시 취소!
    throw new PaymentAmountMismatchException();
  }

  // 4. 결제 완료 처리
  order.updateStatus(OrderStatus.PAID);
  return PaymentResponse.of(payment, order);
}`,
    codeTitle: 'Step 6: 서버 검증 (PaymentService.java)',
    codeLanguage: 'java',
    type: 'lock',
    important: true,
  },
  {
    id: 7,
    actor: 'PG → Server',
    title: 'Webhook 수신',
    description: 'PG사가 서버로 결제 상태 변경을 비동기로 알립니다.',
    detail: 'Webhook은 결제 완료 외에도 취소, 환불 등 상태 변경을 알립니다. 중요한 점은 Webhook 내용도 신뢰하지 않고, 수신 즉시 PG API를 재조회해야 한다는 것입니다.',
    keyPoints: [
      'Webhook 내용은 절대 신뢰하지 않음',
      '수신 즉시 PG API로 단건 조회 후 상태 반영',
      '멱등성 보장: 중복 수신해도 항상 200 반환',
      'Webhook 유실 대비 → 5분 주기 스케줄러 보완',
    ],
    code: `// PaymentController.java
@PostMapping("/webhook")
public ApiResponse<Void> receiveWebhook(
    @RequestBody PaymentWebhookRequest request) {

  // Webhook 내용은 신뢰하지 않음!
  // imp_uid로 PG API를 직접 재조회
  paymentService.processWebhook(
      request.getImpUid(),
      request.getMerchantUid()
  );
  return ApiResponse.success("처리 완료", null);
  // 중복 수신해도 항상 200 반환 (멱등성)
}`,
    codeTitle: 'Step 7: Webhook 처리',
    codeLanguage: 'java',
    type: 'webhook',
  },
  {
    id: 8,
    actor: 'Server',
    title: '주문 완료',
    description: '결제 확정 후 재고 차감, 포인트 적립 등 후처리를 진행합니다.',
    detail: 'SAGA 패턴을 적용하여 후처리(재고 차감, 포인트 적립) 중 하나라도 실패하면 전체 결제를 자동 취소합니다. 이로써 데이터 일관성을 보장합니다.',
    keyPoints: [
      'SAGA 패턴: 부분 실패 시 전체 자동 취소',
      '재고 차감 → 포인트 적립 순차 처리',
      '실패 시 결제 자동 취소 + 사용자 알림',
      '주문 상태: PAID → Order Complete',
    ],
    code: `// PaymentSagaService.java
public void processAfterPayment(String orderNo) {
  try {
    inventoryService.decreaseStock(orderNo);  // 재고 차감
    pointService.earnPoints(orderNo);          // 포인트 적립
  } catch (Exception e) {
    // 어느 단계든 실패 시 전체 취소 (SAGA 보상 트랜잭션)
    paymentService.cancelForSaga(orderNo);
    throw e;
  }
}`,
    codeTitle: 'Step 8: SAGA 패턴',
    codeLanguage: 'java',
    type: 'server',
  },
]

const ACTOR_COLORS = {
  client: 'bg-blue-500/10 border-blue-500/40 text-blue-400',
  server: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
  pg: 'bg-orange-500/10 border-orange-500/40 text-orange-400',
  webhook: 'bg-purple-500/10 border-purple-500/40 text-purple-400',
  lock: 'bg-red-500/10 border-red-500/40 text-red-400',
}

const STEP_DOT_COLORS = {
  client: 'bg-blue-500',
  server: 'bg-emerald-500',
  pg: 'bg-orange-500',
  webhook: 'bg-purple-500',
  lock: 'bg-red-500',
}

export default function FlowVisualization() {
  const [active, setActive] = useState<number>(1)
  const [showCode, setShowCode] = useState(true)
  const current = STEPS.find((s) => s.id === active)!

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">결제 플로우 시각화</h1>
        <p className="text-gray-400">
          각 단계를 클릭하면 상세 설명과 실제 코드를 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Step List */}
        <div className="lg:col-span-2 space-y-1">
          {STEPS.map((step, i) => (
            <div key={step.id}>
              <button
                onClick={() => setActive(step.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                  active === step.id
                    ? 'bg-gray-800 border-gray-600 shadow-lg'
                    : 'bg-gray-900/50 border-gray-800 hover:bg-gray-900 hover:border-gray-700'
                }`}
              >
                {/* Step Number */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      active === step.id
                        ? `${STEP_DOT_COLORS[step.type]} text-white`
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-6 mt-1 transition-colors ${
                        active > step.id ? 'bg-gray-600' : 'bg-gray-800'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`badge border text-xs ${ACTOR_COLORS[step.type]}`}
                    >
                      {step.actor}
                    </span>
                    {step.important && (
                      <span className="badge bg-red-500/20 border-red-500/40 text-red-400 text-xs">
                        핵심
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-medium text-sm ${
                      active === step.id ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                </div>

                <ChevronRight
                  size={16}
                  className={`shrink-0 transition-colors ${
                    active === step.id ? 'text-white' : 'text-gray-600'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step Header */}
          <div className="card p-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border ${ACTOR_COLORS[current.type]}`}
              >
                {current.id}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge border ${ACTOR_COLORS[current.type]}`}>
                    {current.actor}
                  </span>
                  {current.important && (
                    <span className="badge bg-red-500/20 border-red-500/40 text-red-400">
                      위변조 방지 핵심
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{current.title}</h2>
                <p className="text-gray-400 mt-2 leading-relaxed">{current.detail}</p>
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" />
              핵심 포인트
            </h3>
            <ul className="space-y-2">
              {current.keyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Code Block */}
          {current.code && (
            <div>
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
              >
                <Code size={14} />
                실제 구현 코드
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showCode ? '' : '-rotate-90'}`}
                />
              </button>
              {showCode && (
                <CodeBlock
                  code={current.code}
                  language={current.codeLanguage}
                  title={current.codeTitle}
                />
              )}
            </div>
          )}

          {/* Step 6 Special Warning */}
          {current.id === 6 && (
            <div className="flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">
                  클라이언트 금액을 절대 신뢰하지 마세요
                </p>
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  프론트엔드에서 금액을 조작한 뒤 결제하더라도, 서버에서 DB 금액과 PG 실제 결제 금액을 비교하여 불일치하면 즉시 취소합니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 7 Lock Info */}
          {current.id === 6 && (
            <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Lock size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-300 mb-1">
                  Redis 분산락 (Redisson)
                </p>
                <p className="text-xs text-blue-400/70 leading-relaxed">
                  동일 주문에 대한 중복 결제 검증 요청이 동시에 들어오더라도, 분산락으로 직렬화하여 한 번만 처리됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActive(Math.max(1, active - 1))}
              disabled={active === 1}
              className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← 이전 단계
            </button>
            <span className="text-sm text-gray-600 self-center">
              {active} / {STEPS.length}
            </span>
            <button
              onClick={() => setActive(Math.min(STEPS.length, active + 1))}
              disabled={active === STEPS.length}
              className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
