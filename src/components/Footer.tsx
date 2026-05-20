import { Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">PayCore</p>
              <p className="text-gray-500 text-xs">PortOne V1 API 기반 결제 통합 플레이그라운드</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Spring Boot · Redis · PortOne</span>
            <a
              href="https://github.com/dev-jeonggu/Commerce-Payment-Orchestrator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Github size={14} />
              Source Code
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600">
          <div>
            <p className="text-gray-400 font-medium mb-2">백엔드 스택</p>
            <ul className="space-y-1">
              <li>Spring Boot 3.x</li>
              <li>PostgreSQL / JPA</li>
              <li>Redis (Redisson)</li>
              <li>WebClient</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-2">결제 연동</p>
            <ul className="space-y-1">
              <li>PortOne V1 API</li>
              <li>KakaoPay</li>
              <li>TossPayments</li>
              <li>KG이니시스</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-2">핵심 기능</p>
            <ul className="space-y-1">
              <li>분산락 (Redisson)</li>
              <li>멱등성 보장</li>
              <li>SAGA 패턴</li>
              <li>자동 복구 스케줄러</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-2">API 엔드포인트</p>
            <ul className="space-y-1">
              <li>POST /api/v1/orders</li>
              <li>POST /api/v1/payments/verify</li>
              <li>POST /api/v1/payments/webhook</li>
              <li>POST /api/v1/payments/cancel</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
