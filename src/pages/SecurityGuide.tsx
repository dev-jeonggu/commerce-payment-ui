import { Shield, XCircle, CheckCircle, AlertTriangle, Lock, RefreshCw, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import CodeBlock from '../components/CodeBlock'

const BAD_CODE = `// ❌ 잘못된 방식 - 프론트에서 결제 완료 처리
IMP.request_pay({
  merchant_uid: "order_001",
  amount: 30000,  // 사용자가 DevTools로 변조 가능!
}, function(rsp) {
  if (rsp.success) {
    // ❌ PG가 성공했다고 바로 주문 완료 처리
    updateOrderStatus("PAID", rsp.paid_amount);
    // 사용자가 30000 → 100으로 변조했어도 모름!
  }
})`

const GOOD_CODE = `// ✅ 올바른 방식 - 서버에서 금액 검증
IMP.request_pay({
  merchant_uid: orderNo, // 서버에서 받은 주문번호
  amount: 30000,         // 표시용 (검증 기준 아님)
}, async function(rsp) {
  if (rsp.success) {
    // ✅ 반드시 서버에 검증 요청
    const result = await fetch('/api/v1/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        imp_uid: rsp.imp_uid,
        merchant_uid: rsp.merchant_uid,
        // amount는 보내지 않음 (서버가 DB에서 조회)
      })
    }).then(r => r.json())

    if (result.success) {
      // 서버가 금액을 검증하고 PAID 처리한 후 응답
      showOrderComplete(result.data)
    }
  }
})`

const SERVER_VERIFY_CODE = `// PaymentService.java - 서버 사이드 검증 핵심
public PaymentResponse verifyAndSavePayment(PaymentVerifyRequest req) {

  // Step 1: PortOne API로 실제 결제 정보 조회
  // (클라이언트가 보낸 데이터가 아닌 PG API 직접 조회)
  PortOnePaymentResponse pgPayment =
      portOneClient.getPaymentByImpUid(req.getImpUid());

  // Step 2: DB에 저장된 주문 금액 조회
  Order order = orderRepository
      .findByOrderNo(req.getMerchantUid())
      .orElseThrow(() -> new PaycoreException(ORDER_NOT_FOUND));

  // Step 3: 금액 일치 여부 확인 (핵심!)
  if (!order.getAmount().equals(pgPayment.getAmount())) {
    // 금액 불일치 → 즉시 PG 결제 취소
    portOneClient.cancelPayment(
        new PortOneCancelRequest(req.getMerchantUid(), "금액 위변조 감지")
    );
    throw new PaymentAmountMismatchException();
  }

  // Step 4: 검증 통과 → 결제 완료 처리
  payment.confirm(pgPayment.getImpUid(), pgPayment.getAmount(),
                  pgPayment.getPayMethod());
  order.updateStatus(OrderStatus.PAID);

  return PaymentResponse.of(payment, order);
}`

const LOCK_CODE = `// DistributedLockService.java - 분산락으로 중복 방지
public <T> T executeWithPaymentLock(
    String merchantUid, Supplier<T> task) {

  String lockKey = "payment:lock:" + merchantUid;
  RLock lock = redissonClient.getLock(lockKey);

  // 3초 대기, 10초 후 자동 해제
  boolean acquired = lock.tryLock(3, 10, TimeUnit.SECONDS);
  if (!acquired) {
    throw new PaycoreException(ALREADY_PROCESSING);
  }

  try {
    return task.get(); // 검증 로직 실행
  } finally {
    lock.unlock(); // 반드시 해제
  }
}`

const IDEMPOTENCY_CODE = `// 멱등성: 동일 Webhook 중복 수신 시 안전하게 처리
public void processWebhook(String impUid, String merchantUid) {
  Order order = orderRepository
      .findByOrderNo(merchantUid)
      .orElseThrow(() -> new PaycoreException(ORDER_NOT_FOUND));

  // 이미 처리된 경우 무시 (멱등성 보장)
  if (order.getStatus() == OrderStatus.PAID) {
    log.info("[Webhook] 이미 처리된 주문 - 무시: {}", merchantUid);
    return; // 중복이어도 200 반환
  }

  // Webhook 내용 신뢰하지 않고 PG API 재조회
  PortOnePaymentResponse pgPayment =
      portOneClient.getPaymentByImpUid(impUid);

  if ("paid".equals(pgPayment.getStatus())) {
    order.updateStatus(OrderStatus.PAID);
  }
}`

const PRINCIPLES = [
  {
    icon: Shield,
    title: '서버 주도 검증',
    description: '클라이언트에서 받은 금액이나 상태 값은 절대 신뢰하지 않습니다. 모든 검증은 서버에서 PG API를 직접 조회하여 수행합니다.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Lock,
    title: '분산락으로 중복 방지',
    description: '동일 주문에 대한 동시 요청(중복 결제, 동시 취소)을 Redis 분산락으로 직렬화하여 데이터 일관성을 보장합니다.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: RefreshCw,
    title: '멱등성 보장',
    description: '동일한 Webhook이나 결제 검증 요청이 여러 번 수신되어도 결과가 항상 동일합니다. PG에도 항상 200을 반환합니다.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: AlertTriangle,
    title: 'SAGA 패턴으로 보상 처리',
    description: '결제 후처리(재고 차감, 포인트 적립) 중 실패가 발생하면 전체 결제를 자동 취소하는 보상 트랜잭션을 수행합니다.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
]

const ATTACK_STEPS = [
  { step: '1', label: '상품 금액 확인', desc: '사용자가 상품 30,000원을 확인', safe: true },
  { step: '2', label: 'DevTools 조작', desc: 'IMP.request_pay의 amount를 100원으로 변조', safe: false },
  { step: '3', label: 'PG 결제 진행', desc: 'PG는 100원으로 결제 승인, imp_uid 발급', safe: false },
  { step: '4', label: '서버 검증 요청', desc: 'imp_uid와 merchant_uid를 서버로 전송', safe: null },
  { step: '5', label: '서버 금액 비교', desc: 'DB: 30,000 ≠ PG: 100 → 불일치 감지!', safe: false },
  { step: '6', label: '즉시 PG 취소', desc: '서버가 즉시 PG 취소 API 호출 + 예외 반환', safe: true },
]

export default function SecurityGuide() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={24} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-white">왜 서버 검증이 필요한가</h1>
        </div>
        <p className="text-gray-400 max-w-2xl">
          결제 금액 위변조는 실제 서비스에서 발생할 수 있는 심각한 보안 취약점입니다.
          프론트엔드에서 결제를 완료 처리하면 안 되는 이유와 올바른 서버 검증 방식을 설명합니다.
        </p>
      </div>

      {/* Attack Scenario */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">금액 변조 공격 시나리오</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ATTACK_STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`card p-4 border ${
                s.safe === false
                  ? 'border-red-500/30 bg-red-500/5'
                  : s.safe === true && i >= 4
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    s.safe === false
                      ? 'bg-red-500/20 text-red-400'
                      : i >= 4
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
                {s.safe === false && i < 4 && (
                  <XCircle size={14} className="text-red-400 shrink-0 mt-0.5 ml-auto" />
                )}
                {i >= 4 && (
                  <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5 ml-auto" />
                )}
              </div>
              {i < ATTACK_STEPS.length - 1 && (
                <div className="flex justify-center mt-3">
                  <ChevronRight size={14} className="text-gray-700 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bad vs Good Comparison */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">잘못된 방식 vs 올바른 방식</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bad */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <XCircle size={18} className="text-red-400" />
              <div>
                <p className="font-semibold text-red-300">잘못된 방식</p>
                <p className="text-xs text-red-400/70">프론트엔드에서 결제 완료 처리</p>
              </div>
            </div>
            <CodeBlock code={BAD_CODE} language="javascript" title="❌ Bad: client-side.js" />
            <div className="card p-4 border-red-500/20">
              <p className="text-sm font-semibold text-red-300 mb-2">취약점</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  브라우저 DevTools로 amount 값 변조 가능
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  30,000원 상품을 100원에 구매 가능
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  PG는 요청받은 금액대로 승인 (금액 검증 없음)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  서버는 PG 성공 여부만 확인하므로 탐지 불가
                </li>
              </ul>
            </div>
          </div>

          {/* Good */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle size={18} className="text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-300">올바른 방식</p>
                <p className="text-xs text-emerald-400/70">서버에서 PG API 재조회 후 금액 검증</p>
              </div>
            </div>
            <CodeBlock code={GOOD_CODE} language="javascript" title="✅ Good: client-side.js" />
            <div className="card p-4 border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-300 mb-2">보안 포인트</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  서버가 DB 금액과 PG 실제 금액을 직접 비교
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  클라이언트 데이터는 검증에 사용하지 않음
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  불일치 감지 즉시 자동 PG 취소
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  분산락으로 동시 요청도 안전하게 처리
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Server Verification Code */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">서버 검증 구현 코드</h2>
        <CodeBlock
          code={SERVER_VERIFY_CODE}
          language="java"
          title="PaymentService.java"
        />
      </section>

      {/* Security Principles */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">보안 설계 원칙 4가지</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className={`card p-5 border ${p.border}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${p.bg}`}>
                <p.icon size={18} className={p.color} />
              </div>
              <h3 className="font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Distributed Lock */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">분산락 구현 (Redisson)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <CodeBlock
              code={LOCK_CODE}
              language="java"
              title="DistributedLockService.java"
            />
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-white mb-4">분산락이 필요한 이유</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">중복 결제 방지</p>
                  <p className="text-xs text-gray-500 mt-1">
                    사용자가 결제 버튼을 빠르게 여러 번 누르거나, 네트워크 지연으로 같은 요청이 중복 발송되어도 한 번만 처리됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🔄</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">동시 취소 요청 처리</p>
                  <p className="text-xs text-gray-500 mt-1">
                    동일 주문에 대한 취소 요청이 동시에 여러 건 들어와도 직렬화하여 정확히 한 번만 취소합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Redis 분산 환경 지원</p>
                  <p className="text-xs text-gray-500 mt-1">
                    단일 서버뿐 아니라 여러 서버가 동시에 요청을 처리하는 환경에서도 락을 보장합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Idempotency */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">멱등성 보장 (Idempotency)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <CodeBlock
              code={IDEMPOTENCY_CODE}
              language="java"
              title="PaymentService.processWebhook()"
            />
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-white mb-4">멱등성이 중요한 이유</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-950 text-xs font-mono">
                <p className="text-gray-600">// PG사 입장에서는...</p>
                <p className="text-gray-300">Webhook 전송 실패 → 재전송</p>
                <p className="text-gray-300">동일 Webhook이 2~3회 도착 가능</p>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  이미 처리된 주문은 상태 변경 없이 200 반환
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  PG사가 Webhook 실패로 판단하지 않도록 보장
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  데이터 중복 저장 방지
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="card p-6 sm:p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-3">직접 테스트해 보세요</h3>
        <p className="text-gray-400 mb-6">
          실제 PortOne 샌드박스 환경에서 결제 → 서버 검증 흐름을 체험할 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/playground" className="btn-primary flex items-center gap-2">
            결제 직접 테스트 <ChevronRight size={14} />
          </Link>
          <Link to="/flow" className="btn-secondary flex items-center gap-2">
            결제 플로우 시각화
          </Link>
        </div>
      </div>
    </div>
  )
}
