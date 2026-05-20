import { Link } from 'react-router-dom'
import {
  Zap, Bell, CheckCircle, RotateCcw, XCircle, Lock, RefreshCw,
  ArrowRight, ExternalLink, Shield, Clock
} from 'lucide-react'

const FEATURES = [
  { icon: Zap, label: '결제 요청 테스트', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Bell, label: 'Webhook 시뮬레이션', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: CheckCircle, label: '승인 API 테스트', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: RotateCcw, label: '취소 테스트', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { icon: XCircle, label: '실패 시나리오', color: 'text-red-400', bg: 'bg-red-400/10' },
  { icon: Lock, label: 'Redis Lock 설명', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: RefreshCw, label: 'Idempotency 설명', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
]

const PG_PROVIDERS = [
  {
    id: 'portone',
    name: 'PortOne',
    subtitle: '구 아이포트 · 국내 최다 PG 연동',
    emoji: '🔵',
    color: 'border-blue-500/40 hover:border-blue-500/80',
    accent: 'bg-blue-500/10',
    textAccent: 'text-blue-400',
    badge: { label: '현재 연동', style: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    features: [
      '분산락 (Redisson) 적용',
      '결제 금액 위변조 방지',
      'Webhook 멱등성 보장',
      '자동 복구 스케줄러 (5분)',
      'SAGA 패턴 (실패 시 자동 취소)',
      '부분 취소 / 전액 취소',
      'PG 단건 조회 재검증',
    ],
    available: true,
    link: '/playground',
    docsUrl: 'https://developers.portone.io',
  },
  {
    id: 'toss',
    name: 'TossPayments',
    subtitle: '토스페이먼츠 · 간편결제 대표',
    emoji: '💙',
    color: 'border-sky-500/40 hover:border-sky-500/80',
    accent: 'bg-sky-500/10',
    textAccent: 'text-sky-400',
    badge: { label: 'PortOne 경유', style: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
    features: [
      '카드 결제 (신용/체크)',
      '계좌이체',
      '가상계좌',
      '브랜드페이 (간편결제)',
      'Webhook 수신',
      '에스크로 지원',
      '정기결제 (빌링키)',
    ],
    available: true,
    link: '/playground',
    docsUrl: 'https://docs.tosspayments.com',
  },
  {
    id: 'kakao',
    name: 'KakaoPay',
    subtitle: '카카오페이 · 국내 최대 간편결제',
    emoji: '💛',
    color: 'border-yellow-500/40 hover:border-yellow-500/80',
    accent: 'bg-yellow-500/10',
    textAccent: 'text-yellow-400',
    badge: { label: 'PortOne 경유', style: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    features: [
      'QR 코드 결제',
      '앱 간편결제',
      '자동결제 (정기)',
      'Webhook 수신',
      '카카오페이 포인트',
      '부분 취소 지원',
      '모바일 최적화',
    ],
    available: true,
    link: '/playground',
    docsUrl: 'https://developers.kakao.com/docs/latest/ko/kakaopay',
  },
  {
    id: 'naver',
    name: '네이버페이',
    subtitle: '네이버 · 포인트 기반 간편결제',
    emoji: '💚',
    color: 'border-green-500/30 hover:border-green-500/50',
    accent: 'bg-green-500/10',
    textAccent: 'text-green-400',
    badge: { label: '준비중', style: 'bg-gray-700 text-gray-400 border-gray-600' },
    features: [
      '네이버페이 결제',
      '네이버포인트 적립',
      '분할 납부 지원',
      'Webhook 수신',
      '자동결제',
      '구독 서비스',
    ],
    available: false,
    link: '/playground',
    docsUrl: 'https://developer.pay.naver.com',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    subtitle: '글로벌 결제 표준 · 해외카드',
    emoji: '🟣',
    color: 'border-purple-500/30 hover:border-purple-500/50',
    accent: 'bg-purple-500/10',
    textAccent: 'text-purple-400',
    badge: { label: '준비중', style: 'bg-gray-700 text-gray-400 border-gray-600' },
    features: [
      '해외 신용카드 지원',
      'Apple Pay / Google Pay',
      '구독 결제',
      '3D Secure',
      'Webhook',
      '분할결제',
    ],
    available: false,
    link: '/playground',
    docsUrl: 'https://stripe.com/docs',
  },
]

const ARCH_ITEMS = [
  { label: 'frontend', items: ['payment-guide-ui'], color: 'text-blue-400' },
  { label: 'backend', items: ['payment-api', 'webhook-api', 'pg-adapter', 'payment-core', 'payment-logs'], color: 'text-emerald-400' },
  { label: 'infra', items: ['PostgreSQL', 'Redis (Redisson)', 'PortOne API'], color: 'text-orange-400' },
]

export default function Home() {
  return (
    <div className="bg-grid-pattern">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              PortOne V1 API · Spring Boot · Redis Distributed Lock
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Payment Integration
              <span className="block gradient-text">Playground</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-10">
              실제 결제 플랫폼처럼 구성된 결제 통합 테스트 환경입니다.
              <br className="hidden sm:inline" />
              결제 흐름 시각화부터 위변조 방지까지 직접 체험해 보세요.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/playground"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
              >
                결제 테스트 시작 <ArrowRight size={16} />
              </Link>
              <Link
                to="/flow"
                className="flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-xl transition-colors"
              >
                결제 플로우 보기
              </Link>
            </div>
          </div>

          {/* Feature Chips */}
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/60 ${f.color}`}
              >
                <span className={`p-1 rounded-full ${f.bg}`}>
                  <f.icon size={12} />
                </span>
                <span className="text-sm text-gray-300">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800/60 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '6+', label: '결제 시나리오 테스트', icon: CheckCircle },
              { value: '5min', label: 'PENDING 자동 복구 주기', icon: Clock },
              { value: '3-PG', label: '연동 결제사', icon: Shield },
              { value: '100%', label: '멱등성 보장', icon: RefreshCw },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <s.icon size={18} className="text-blue-400 mb-1" />
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PG Provider Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">결제 연동 가이드</h2>
          <p className="text-gray-400">
            각 PG사별 결제 연동 방식과 기능을 확인하고 직접 테스트해 보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PG_PROVIDERS.map((pg) => (
            <div
              key={pg.id}
              className={`card p-6 border transition-all duration-200 ${pg.color}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${pg.accent}`}>
                    {pg.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{pg.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{pg.subtitle}</p>
                  </div>
                </div>
                <span className={`badge border ${pg.badge.style}`}>{pg.badge.label}</span>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {pg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={pg.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  공식 문서 <ExternalLink size={12} />
                </a>
                {pg.available ? (
                  <Link
                    to={`${pg.link}?pg=${pg.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    직접 테스트 <ArrowRight size={12} />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    준비중
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6">서비스 아키텍처</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {ARCH_ITEMS.map((layer) => (
              <div key={layer.label}>
                <p className={`text-xs font-mono font-semibold mb-3 ${layer.color}`}>
                  {layer.label}/
                </p>
                <ul className="space-y-2">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      <span className="text-sm text-gray-400 font-mono">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 flex flex-wrap gap-3">
            <Link to="/flow" className="btn-primary flex items-center gap-2">
              결제 플로우 시각화 보기 <ArrowRight size={14} />
            </Link>
            <Link to="/security" className="btn-secondary flex items-center gap-2">
              서버 검증이 필요한 이유
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
