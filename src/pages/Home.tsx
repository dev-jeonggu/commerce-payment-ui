import { Link } from 'react-router-dom'
import {
  Zap, RefreshCw, Code2, ArrowRight, CheckCircle,
  CreditCard, Building2, Lock, BarChart3, Webhook
} from 'lucide-react'

const MERCHANT_BENEFITS = [
  {
    icon: CreditCard,
    title: '결제 수단은 PayCore가 처리',
    desc: '가맹점은 API 하나만 호출하면 됩니다. 카드·간편결제·가상계좌·휴대폰 결제 모두 동일한 인터페이스로 처리됩니다.',
    color: 'text-blue-400', bg: 'bg-blue-500/10',
  },
  {
    icon: Lock,
    title: '카드 정보는 가맹점에 남지 않음',
    desc: '고객의 카드 정보는 PG사에서 직접 처리합니다. 가맹점 서버에는 결제 결과만 전달됩니다.',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10',
  },
  {
    icon: Webhook,
    title: 'Webhook으로 실시간 알림',
    desc: '결제 완료·취소·가상계좌 입금 시 가맹점 서버로 자동 알림을 보냅니다. 폴링 없이 실시간 처리.',
    color: 'text-purple-400', bg: 'bg-purple-500/10',
  },
  {
    icon: RefreshCw,
    title: '정기결제 · 구독 지원',
    desc: '빌링키를 한 번 발급하면 가맹점이 원하는 주기에 자동으로 결제를 처리할 수 있습니다.',
    color: 'text-yellow-400', bg: 'bg-yellow-500/10',
  },
  {
    icon: Building2,
    title: '가상계좌 발급 자동화',
    desc: '고객에게 개인화된 계좌번호를 발급합니다. 입금 시 PayCore가 자동으로 확인하고 가맹점에 알립니다.',
    color: 'text-sky-400', bg: 'bg-sky-500/10',
  },
  {
    icon: BarChart3,
    title: '중복 결제 · 이중청구 방지',
    desc: 'Redis 분산락과 멱등성 처리로 네트워크 오류가 생겨도 절대 중복 결제가 발생하지 않습니다.',
    color: 'text-rose-400', bg: 'bg-rose-500/10',
  },
]

const FLOW_STEPS = [
  {
    actor: '가맹점 서버',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    steps: [
      '고객이 주문 → 가맹점 서버에서 주문번호 생성',
      'POST /api/v1/payments 호출 (금액, 결제수단 전달)',
    ],
  },
  {
    actor: 'PayCore',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    steps: [
      'PG사 API로 결제 승인 요청',
      '결제 결과 저장 (분산락·멱등성 자동 처리)',
      '가맹점 Webhook URL로 결과 알림 발송',
    ],
  },
  {
    actor: '가맹점 서버',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    steps: [
      'Webhook 수신 → 주문 상태 업데이트',
      '고객에게 결제 완료 응답',
    ],
  },
]

export default function Home() {
  return (
    <div className="lg:ml-60 bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 sm:px-10 pt-20 pb-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-7">
            <Zap size={11} fill="currentColor" />
            가맹점용 결제 API · PortOne 기반
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            결제 연동, 한 번으로
            <br />
            <span className="text-blue-400">끝냅니다</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl">
            가맹점은 PayCore API 하나만 연동하면 됩니다.
            카드 처리, PG 라우팅, Webhook 알림, 취소·환불까지
            PayCore가 전부 대신합니다.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/quickstart"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm"
            >
              빠르게 시작하기 <ArrowRight size={14} />
            </Link>
            <Link
              to="/tutorial"
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors border border-gray-700 text-sm"
            >
              <Code2 size={14} /> 연동 튜토리얼 보기
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-xs text-gray-500">
            {['가맹점 API Key 인증', '분산락 · 멱등성 내장', 'Webhook 자동 재시도', 'ELK 로그 분석'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-emerald-600" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 결제 흐름 */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-16 border-b border-gray-800/60">
        <h2 className="text-xl font-bold text-white mb-2">가맹점 결제 흐름</h2>
        <p className="text-gray-500 text-sm mb-8">
          가맹점은 PayCore에만 연동하면 됩니다. PG사별 개별 연동이 필요 없습니다.
        </p>
        <div className="space-y-4">
          {FLOW_STEPS.map((section, i) => (
            <div key={i} className={`rounded-xl border p-4 ${section.color.split(' ').slice(1).join(' ')}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${section.color.split(' ')[0]}`}>
                {section.actor}
              </p>
              <ul className="space-y-1.5">
                {section.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-gray-600 mt-0.5">→</span>{step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4 text-center">
          고객의 카드 정보는 PG사에서만 처리 · 가맹점 서버에 저장되지 않음
        </p>
      </section>

      {/* 가맹점 혜택 */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-16 border-b border-gray-800/60">
        <h2 className="text-xl font-bold text-white mb-2">가맹점이 직접 구현하지 않아도 되는 것들</h2>
        <p className="text-gray-500 text-sm mb-8">PayCore가 대신 처리합니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MERCHANT_BENEFITS.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="p-5 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors">
                <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={f.color} />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* API 미리보기 */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-16">
        <h2 className="text-xl font-bold text-white mb-2">연동은 이것만으로 충분합니다</h2>
        <p className="text-gray-500 text-sm mb-6">결제 요청 API 하나로 모든 결제 수단을 처리합니다.</p>
        <div className="rounded-xl overflow-hidden border border-gray-800">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-500 font-mono ml-1">POST /api/v1/payments</span>
          </div>
          <pre className="bg-gray-950 p-5 text-sm leading-relaxed overflow-x-auto">
            <code className="text-gray-300 font-mono">{`// 헤더
X-Merchant-Id: your-merchant-id
X-Api-Key:     your-secret-key

// 요청 본문
{
  "merchantId":      "your-merchant-id",
  "merchantOrderId": "ORD-20260531-00001",  // 가맹점 주문번호
  "amount":          30000,
  "paymentMethod":   "CARD",                // CARD | MOBILE | BANK_TRANSFER
  "orderName":       "MacBook Air M3"
}

// 응답
{
  "success": true,
  "data": {
    "merchantOrderId": "ORD-20260531-00001",
    "paymentStatus":   "PAID",
    "paidAmount":      30000,
    "txId":            "pg_tx_abc123"
  }
}`}</code>
          </pre>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/tutorial"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-sm"
          >
            연동 튜토리얼 시작 <ArrowRight size={14} />
          </Link>
          <Link to="/reference" className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors text-sm">
            전체 API 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
