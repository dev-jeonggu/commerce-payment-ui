import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, CreditCard, CheckCircle, XCircle, AlertTriangle,
  Loader2, RefreshCw, RotateCcw, ChevronRight
} from 'lucide-react'
import { createOrder } from '../api/orders'
import { verifyPayment, cancelPayment } from '../api/payments'
import { usePortOne } from '../hooks/usePortOne'
import CodeBlock from '../components/CodeBlock'
import type { OrderCreateResponse, PaymentResponse, PGProvider } from '../types'

// 백엔드 ItemService.ITEM_PRICE_TABLE 과 동일한 값
const PRODUCTS = [
  { id: 1, itemId: 1, name: '기본 상품', price: 10000, description: '₩10,000 카드 결제 테스트', emoji: '📦' },
  { id: 2, itemId: 2, name: '스탠다드 상품', price: 20000, description: '₩20,000 카드 결제 테스트', emoji: '🛍️' },
  { id: 3, itemId: 10, name: '프리미엄 상품', price: 30000, description: '₩30,000 카드 결제 테스트', emoji: '💎' },
]

const PG_OPTIONS = [
  {
    id: 'danal' as PGProvider,
    label: '다날 (신용카드)',
    description: '다날 일반결제 · 신용카드',
    payMethod: 'card',
    badge: '✅ 연동 완료',
    color: 'border-rose-500/40',
    activeColor: 'border-rose-500 bg-rose-500/10',
  },
  {
    id: 'danal_tpay' as PGProvider,
    label: '다날 T-Pay (휴대폰결제)',
    description: '다날 · 휴대폰 소액결제',
    payMethod: 'phone',
    badge: '✅ 연동 완료',
    color: 'border-pink-500/40',
    activeColor: 'border-pink-500 bg-pink-500/10',
  },
  {
    id: 'html5_inicis' as PGProvider,
    label: 'KG이니시스 (신용카드)',
    description: '국내 카드사 테스트 카드 제공',
    payMethod: 'card',
    badge: '테스트 카드 사용 가능',
    color: 'border-blue-500/40',
    activeColor: 'border-blue-500 bg-blue-500/10',
  },
  {
    id: 'kakaopay' as PGProvider,
    label: 'KakaoPay',
    description: '카카오페이 앱 또는 QR 결제',
    payMethod: 'card',
    badge: '카카오페이 앱 필요',
    color: 'border-yellow-500/40',
    activeColor: 'border-yellow-500 bg-yellow-500/10',
  },
  {
    id: 'tosspayments' as PGProvider,
    label: 'TossPayments',
    description: '토스페이먼츠 테스트 결제',
    payMethod: 'card',
    badge: '토스 앱 또는 카드',
    color: 'border-sky-500/40',
    activeColor: 'border-sky-500 bg-sky-500/10',
  },
]

type Step = 1 | 2 | 3
type StepStatus = 'idle' | 'loading' | 'success' | 'error'

export default function Playground() {
  const [searchParams] = useSearchParams()
  const initialPg = (searchParams.get('pg') === 'toss'
    ? 'tosspayments'
    : searchParams.get('pg') === 'kakao'
    ? 'kakaopay'
    : searchParams.get('pg') === 'inicis'
    ? 'html5_inicis'
    : 'danal') as PGProvider

  const [step, setStep] = useState<Step>(1)
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[1])
  const [selectedPg, setSelectedPg] = useState<PGProvider>(initialPg)
  const [order, setOrder] = useState<OrderCreateResponse | null>(null)
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StepStatus>('idle')
  const [cancelAmount, setCancelAmount] = useState('')
  const [cancelStatus, setCancelStatus] = useState<StepStatus>('idle')
  const [cancelResult, setCancelResult] = useState<PaymentResponse | null>(null)

  const { requestPayment } = usePortOne()

  const resetAll = () => {
    setStep(1)
    setOrder(null)
    setPayment(null)
    setError(null)
    setStatus('idle')
    setCancelStatus('idle')
    setCancelResult(null)
    setCancelAmount('')
  }

  // Step 1: 주문 생성
  const handleCreateOrder = async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await createOrder({
        userId: 1,
        itemId: selectedProduct.itemId,
        amount: selectedProduct.price,
      })
      if (res.success && res.data) {
        setOrder(res.data)
        setStep(2)
        setStatus('success')
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '주문 생성 실패')
      setStatus('error')
    }
  }

  // Step 2: PortOne 결제 → 서버 검증
  const handlePay = async () => {
    if (!order) return
    setStatus('loading')
    setError(null)
    try {
      const rsp = await requestPayment({
        pg: selectedPg,
        pay_method: PG_OPTIONS.find((p) => p.id === selectedPg)?.payMethod || 'card',
        merchant_uid: order.orderNo,
        name: selectedProduct.name,
        amount: selectedProduct.price,
        buyer_email: 'test@paycore.dev',
        buyer_name: '테스트 유저',
        buyer_tel: '010-0000-0000',
      })

      // 서버에 검증 요청
      const verify = await verifyPayment({
        imp_uid: rsp.imp_uid,
        merchant_uid: rsp.merchant_uid,
      })

      if (verify.success && verify.data) {
        setPayment(verify.data)
        setStep(3)
        setStatus('success')
      } else {
        throw new Error(verify.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 실패')
      setStatus('error')
    }
  }

  // 취소
  const handleCancel = async () => {
    if (!order) return
    setCancelStatus('loading')
    setError(null)
    try {
      const amount = cancelAmount ? parseInt(cancelAmount) : undefined
      const res = await cancelPayment({
        merchant_uid: order.orderNo,
        reason: '사용자 취소 테스트',
        amount,
      })
      if (res.success && res.data) {
        setCancelResult(res.data)
        setCancelStatus('success')
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소 실패')
      setCancelStatus('error')
    }
  }

  const pgOption = PG_OPTIONS.find((p) => p.id === selectedPg)!

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">결제 직접 테스트</h1>
        <p className="text-gray-400">
          실제 PortOne 샌드박스 환경에서 결제 전체 흐름을 체험합니다.
          주문 생성 → PG 결제 → 서버 검증까지 한 번에 진행됩니다.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10">
        {([
          { n: 1, label: '상품 선택' },
          { n: 2, label: '결제 진행' },
          { n: 3, label: '결과 확인' },
        ] as { n: Step; label: string }[]).map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                step === s.n
                  ? 'bg-blue-600 text-white'
                  : step > s.n
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
                  : 'bg-gray-900 text-gray-500 border border-gray-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">
                {step > s.n ? <CheckCircle size={12} /> : s.n}
              </span>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && (
              <ChevronRight
                size={16}
                className={step > s.n ? 'text-emerald-500' : 'text-gray-700'}
              />
            )}
          </div>
        ))}
        <button
          onClick={resetAll}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors ml-2"
          title="처음부터"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-5">

          {/* Step 1: 상품 & PG 선택 */}
          <div className={`card p-6 transition-opacity ${step !== 1 ? 'opacity-60' : ''}`}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-400" />
              Step 1 · 상품 및 결제사 선택
            </h2>

            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">상품 선택</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => step === 1 && setSelectedProduct(p)}
                    disabled={step !== 1}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedProduct.id === p.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-800 hover:border-gray-600 bg-gray-900'
                    }`}
                  >
                    <span className="text-xl block mb-1">{p.emoji}</span>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.description}</p>
                    <p className="text-sm font-bold text-blue-400 mt-1">
                      ₩{p.price.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">PG사 선택</p>
              <div className="space-y-2">
                {PG_OPTIONS.map((pg) => (
                  <button
                    key={pg.id}
                    onClick={() => step === 1 && setSelectedPg(pg.id)}
                    disabled={step !== 1}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedPg === pg.id ? pg.activeColor : `border-gray-800 hover:border-gray-600 bg-gray-900`
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{pg.label}</p>
                      <p className="text-xs text-gray-500">{pg.description}</p>
                    </div>
                    <span className="text-xs text-gray-600 hidden sm:inline">{pg.badge}</span>
                    {selectedPg === pg.id && (
                      <CheckCircle size={14} className="text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={step !== 1 || status === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {status === 'loading' && step === 1 ? (
                <><Loader2 size={16} className="animate-spin" /> 주문 생성 중...</>
              ) : (
                <>주문 생성 → POST /api/v1/orders</>
              )}
            </button>
          </div>

          {/* Step 2: 결제 진행 */}
          <div className={`card p-6 transition-opacity ${step < 2 ? 'opacity-40' : ''}`}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-400" />
              Step 2 · PG 결제 진행
            </h2>

            {order && (
              <div className="bg-gray-950 rounded-lg p-4 mb-4 font-mono text-xs space-y-1">
                <p className="text-gray-500">// 생성된 주문</p>
                <p>
                  <span className="text-blue-400">orderNo</span>
                  <span className="text-gray-600">: </span>
                  <span className="text-emerald-400">"{order.orderNo}"</span>
                </p>
                <p>
                  <span className="text-blue-400">totalAmount</span>
                  <span className="text-gray-600">: </span>
                  <span className="text-yellow-400">{order.totalAmount}</span>
                </p>
                <p>
                  <span className="text-blue-400">status</span>
                  <span className="text-gray-600">: </span>
                  <span className="text-orange-400">"{order.status}"</span>
                </p>
              </div>
            )}

            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              버튼 클릭 시 <strong>{pgOption.label}</strong> 결제창이 열립니다. 완료 후 서버에서 자동으로 금액 검증합니다.
            </div>

            <button
              onClick={handlePay}
              disabled={step !== 2 || status === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {status === 'loading' && step === 2 ? (
                <><Loader2 size={16} className="animate-spin" /> 결제 & 검증 중...</>
              ) : (
                <>{pgOption.label} 결제하기</>
              )}
            </button>
          </div>

          {/* Step 3: 결과 */}
          <div className={`card p-6 transition-opacity ${step < 3 ? 'opacity-40' : ''}`}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-purple-400" />
              Step 3 · 결제 결과
            </h2>

            {payment && step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle size={20} className="text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-300">결제 검증 완료</p>
                    <p className="text-xs text-emerald-400/70 mt-0.5">
                      서버에서 PG API 재조회 후 금액 일치 확인
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: '주문번호', value: payment.orderNo },
                    { label: '주문 상태', value: payment.orderStatus },
                    { label: '결제 금액', value: `₩${payment.paidAmount?.toLocaleString()}` },
                    { label: '결제 상태', value: payment.paymentStatus },
                    { label: 'PG 결제번호', value: payment.impUid },
                    { label: '결제 수단', value: payment.payMethod },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-950 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                      <p className="text-white font-mono text-xs truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* 취소 테스트 */}
                {!cancelResult && (
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-3">취소 테스트 (선택)</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="취소금액 (미입력 시 전액)"
                        value={cancelAmount}
                        onChange={(e) => setCancelAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                      />
                      <button
                        onClick={handleCancel}
                        disabled={cancelStatus === 'loading'}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-600/40 text-orange-400 hover:bg-orange-600/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {cancelStatus === 'loading' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {cancelResult && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <RotateCcw size={18} className="text-orange-400" />
                    <div>
                      <p className="font-semibold text-orange-300">취소 완료</p>
                      <p className="text-xs text-orange-400/70 mt-0.5">
                        상태: {cancelResult.paymentStatus} · 취소금액: ₩{cancelResult.cancelledAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step < 3 && (
              <p className="text-gray-600 text-sm text-center py-4">결제 완료 후 결과가 표시됩니다.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300 text-sm">오류 발생</p>
                <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Config Notice */}
          <div className="card p-5">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-amber-300">환경 설정 필요</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-gray-600">1.</span>
                <span><code className="text-blue-400">.env</code> 파일에 <code className="text-blue-400">VITE_IMP_CODE</code> 설정 필요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">2.</span>
                <span>백엔드 서버 실행 필요 (<code className="text-blue-400">localhost:8080</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">3.</span>
                <span>PortOne 테스트 계정에서 해당 PG사 연동 필요</span>
              </li>
            </ul>
          </div>

          {/* API Flow */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">API 호출 흐름</p>
            <div className="space-y-2">
              {[
                { method: 'POST', path: '/api/v1/orders', desc: '주문 생성', active: step >= 1 },
                { method: 'SDK', path: 'IMP.request_pay()', desc: 'PG 결제창', active: step >= 2 },
                { method: 'POST', path: '/api/v1/payments/verify', desc: '서버 검증', active: step >= 2 },
                { method: 'POST', path: '/api/v1/payments/cancel', desc: '취소 (선택)', active: step >= 3 },
              ].map((api) => (
                <div
                  key={api.path}
                  className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${
                    api.active ? 'bg-gray-900' : 'bg-gray-950 opacity-40'
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      api.method === 'SDK'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {api.method}
                  </span>
                  <span className="text-xs text-gray-400 font-mono truncate">{api.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Card Info */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">이니시스 테스트 카드</p>
            <CodeBlock
              code={`카드번호: 4242 4242 4242 4242
유효기간: 임의의 미래 날짜
CVC:      임의의 3자리
비밀번호: 임의의 2자리`}
              language="text"
            />
            <p className="text-xs text-gray-600 mt-2">
              * KakaoPay/TossPayments는 각 앱에서 테스트 처리됩니다.
            </p>
          </div>

          {/* Response Preview */}
          {payment && (
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">API 응답 (PaymentResponse)</p>
              <CodeBlock
                code={JSON.stringify(payment, null, 2)}
                language="json"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
