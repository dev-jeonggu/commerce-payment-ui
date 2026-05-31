import { useState } from 'react'
import { ShoppingCart, X, CheckCircle, XCircle, Loader2, RotateCcw, ChevronRight, Tag } from 'lucide-react'
import { generateMerchantOrderId } from '../api/orders'
import { registerPayment, cancelPayment } from '../api/payments'
import { usePortOne } from '../hooks/usePortOne'
import type { PaymentResponse, PGProvider, PaymentMethod } from '../types'

const MERCHANT_ID = import.meta.env.VITE_MERCHANT_ID || ''

// ─── 상품 데이터 ───────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, name: 'MacBook Air M3', price: 1690000, category: '노트북', emoji: '💻', badge: '인기', desc: '15인치 · 8GB · 512GB SSD' },
  { id: 2, name: 'AirPods Pro 2', price: 359000, category: '이어폰', emoji: '🎧', badge: '', desc: '액티브 노이즈 캔슬링 · MagSafe' },
  { id: 3, name: 'iPhone 16 Pro', price: 1550000, category: '스마트폰', emoji: '📱', badge: 'NEW', desc: '256GB · 티타늄 · A18 Pro' },
  { id: 4, name: '모니터 27인치 4K', price: 580000, category: '모니터', emoji: '🖥️', badge: '', desc: 'IPS · 144Hz · USB-C 65W' },
  { id: 5, name: '기계식 키보드', price: 149000, category: '주변기기', emoji: '⌨️', badge: '', desc: '청축 · 무선 · RGB' },
  { id: 6, name: '스마트 워치 S9', price: 459000, category: '웨어러블', emoji: '⌚', badge: '인기', desc: '45mm · GPS · 심박수 측정' },
  { id: 7, name: '태블릿 패드 Pro', price: 990000, category: '태블릿', emoji: '📲', badge: '', desc: '12.9인치 · M2 · WiFi' },
  { id: 8, name: '무선 충전 패드', price: 39000, category: '액세서리', emoji: '🔋', badge: '', desc: '15W · Qi · 멀티 디바이스' },
]

// ─── PG사 옵션 ─────────────────────────────────────────────────
const PG_OPTIONS = [
  { id: 'tosspayments' as PGProvider, label: 'TossPayments', payMethod: 'card', paymentMethod: 'CARD' as PaymentMethod, color: 'bg-sky-500', emoji: '💙' },
  { id: 'kakaopay' as PGProvider, label: 'KakaoPay', payMethod: 'card', paymentMethod: 'CARD' as PaymentMethod, color: 'bg-yellow-400', emoji: '💛' },
  { id: 'danal' as PGProvider, label: '다날 카드', payMethod: 'card', paymentMethod: 'CARD' as PaymentMethod, color: 'bg-rose-500', emoji: '❤️' },
  { id: 'danal_tpay' as PGProvider, label: '다날 T-Pay', payMethod: 'phone', paymentMethod: 'MOBILE' as PaymentMethod, color: 'bg-pink-500', emoji: '📱' },
  { id: 'html5_inicis' as PGProvider, label: 'KG이니시스', payMethod: 'card', paymentMethod: 'CARD' as PaymentMethod, color: 'bg-blue-600', emoji: '💳' },
]

type CartItem = { product: typeof PRODUCTS[0]; qty: number }
type CheckoutStep = 'cart' | 'pay' | 'done'

export default function Shop() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<CheckoutStep>('cart')
  const [selectedPg, setSelectedPg] = useState<PGProvider>('tosspayments')
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelAmount, setCancelAmount] = useState('')
  const [cancelResult, setCancelResult] = useState<PaymentResponse | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const { requestPayment } = usePortOne()

  const totalPrice = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.product.id !== id))
  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter((i) => i.qty > 0))
  }

  const handleCheckout = async () => {
    if (!cart.length) return
    setLoading(true)
    setError(null)
    const orderId = generateMerchantOrderId()
    setMerchantOrderId(orderId)
    const pg = PG_OPTIONS.find((p) => p.id === selectedPg)!
    const itemName = cart.length === 1 ? cart[0].product.name : `${cart[0].product.name} 외 ${cart.length - 1}건`

    try {
      await requestPayment({
        pg: selectedPg,
        pay_method: pg.payMethod,
        merchant_uid: orderId,
        name: itemName,
        amount: totalPrice,
        buyer_email: 'demo@paycore.dev',
        buyer_name: '데모 고객',
        buyer_tel: '010-0000-0000',
      })

      const res = await registerPayment({
        merchantId: MERCHANT_ID,
        merchantOrderId: orderId,
        amount: totalPrice,
        paymentMethod: pg.paymentMethod,
        orderName: itemName,
      })

      if (res.success && res.data) {
        setPayment(res.data)
        setStep('done')
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!merchantOrderId) return
    setCancelLoading(true)
    try {
      const amount = cancelAmount ? parseInt(cancelAmount) : undefined
      const res = await cancelPayment({ merchantOrderId, reason: '구매자 취소', amount })
      if (res.success && res.data) setCancelResult(res.data)
      else throw new Error(res.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소 실패')
    } finally {
      setCancelLoading(false)
    }
  }

  const resetAll = () => {
    setCart([])
    setStep('cart')
    setPayment(null)
    setMerchantOrderId(null)
    setError(null)
    setCancelResult(null)
    setCancelAmount('')
    setCartOpen(false)
  }

  // ─── 결제 완료 화면 ────────────────────────────────────────
  if (step === 'done' && payment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="card p-8">
          {cancelResult ? (
            <>
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-5">
                <RotateCcw size={28} className="text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">결제 취소 완료</h2>
              <p className="text-gray-400 mb-6">취소 금액: ₩{cancelResult.cancelledAmount?.toLocaleString()}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">결제 완료!</h2>
              <p className="text-gray-400 mb-6">주문이 성공적으로 처리되었습니다.</p>
            </>
          )}

          <div className="text-left bg-gray-950 rounded-xl p-5 space-y-3 mb-6 text-sm">
            {[
              { label: '주문번호', value: payment.merchantOrderId },
              { label: '결제금액', value: `₩${payment.paidAmount?.toLocaleString()}` },
              { label: '결제수단', value: payment.paymentMethod },
              { label: '상태', value: cancelResult?.paymentStatus ?? payment.paymentStatus },
              { label: '트랜잭션 ID', value: payment.txId },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-white font-mono text-xs">{item.value}</span>
              </div>
            ))}
          </div>

          {!cancelResult && (
            <div className="mb-6 border-t border-gray-800 pt-5">
              <p className="text-sm text-gray-400 mb-3">결제 취소 테스트</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="취소금액 (비우면 전액)"
                  value={cancelAmount}
                  onChange={(e) => setCancelAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                />
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-600/20 border border-orange-600/40 text-orange-400 hover:bg-orange-600/30 rounded-lg text-sm disabled:opacity-50"
                >
                  {cancelLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  취소
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
              <XCircle size={14} />{error}
            </div>
          )}

          <button onClick={resetAll} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
            쇼핑 계속하기
          </button>
        </div>
      </div>
    )
  }

  // ─── 결제 수단 선택 화면 ───────────────────────────────────
  if (step === 'pay') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <button onClick={() => setStep('cart')} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          ← 장바구니로
        </button>
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-6">결제 수단 선택</h2>

          {/* 주문 요약 */}
          <div className="bg-gray-950 rounded-xl p-4 mb-6 space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.product.emoji} {item.product.name} × {item.qty}</span>
                <span className="text-white">₩{(item.product.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-800 pt-2 flex justify-between font-semibold">
              <span className="text-white">총 결제금액</span>
              <span className="text-blue-400 text-lg">₩{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* PG 선택 */}
          <div className="space-y-2 mb-6">
            {PG_OPTIONS.map((pg) => (
              <button
                key={pg.id}
                onClick={() => setSelectedPg(pg.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  selectedPg === pg.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-800 hover:border-gray-600 bg-gray-900'
                }`}
              >
                <span className="text-xl">{pg.emoji}</span>
                <span className="font-medium text-white">{pg.label}</span>
                {selectedPg === pg.id && <CheckCircle size={16} className="text-blue-400 ml-auto" />}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
              <XCircle size={14} />{error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || !MERCHANT_ID}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-colors"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> 결제 중...</> : <>₩{totalPrice.toLocaleString()} 결제하기</>}
          </button>

          {!MERCHANT_ID && (
            <p className="text-xs text-amber-400 text-center mt-3">
              VITE_MERCHANT_ID 환경변수가 필요합니다.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── 쇼핑몰 메인 ──────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">PayCore 스토어</h1>
          <p className="text-gray-400 text-sm">실제 PG사 결제를 체험할 수 있는 데모 쇼핑몰</p>
        </div>
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors"
        >
          <ShoppingCart size={18} className="text-white" />
          <span className="text-white text-sm font-medium">장바구니</span>
          {totalQty > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {totalQty}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* 상품 그리드 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PRODUCTS.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id)
              return (
                <div key={product.id} className="card p-4 flex flex-col hover:border-gray-700 transition-all group">
                  <div className="relative mb-3">
                    <div className="w-full aspect-square bg-gray-900 rounded-xl flex items-center justify-center text-5xl">
                      {product.emoji}
                    </div>
                    {product.badge && (
                      <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                        product.badge === 'NEW' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Tag size={10} />{product.category}
                    </p>
                    <h3 className="font-semibold text-white text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{product.desc}</p>
                    <p className="text-blue-400 font-bold">₩{product.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      inCart
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {inCart ? `담김 (${inCart.qty})` : '장바구니 담기'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 장바구니 사이드바 */}
        {cartOpen && (
          <div className="w-80 shrink-0">
            <div className="card p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShoppingCart size={16} /> 장바구니 ({totalQty})
                </h3>
                <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">담긴 상품이 없습니다.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
                        <span className="text-2xl">{item.product.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                          <p className="text-xs text-blue-400">₩{(item.product.price * item.qty).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded bg-gray-800 text-white text-xs hover:bg-gray-700">−</button>
                          <span className="text-white text-sm w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded bg-gray-800 text-white text-xs hover:bg-gray-700">+</button>
                          <button onClick={() => removeFromCart(item.product.id)} className="ml-1 text-gray-600 hover:text-red-400">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-800 pt-4 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">상품 {totalQty}개</span>
                      <span className="text-white font-semibold">₩{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('pay')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    결제하기 <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
