import { Link } from 'react-router-dom'
import { ArrowRight, Zap, BookOpen, FlaskConical } from 'lucide-react'
import DocsLayout, { Callout, H2, H3, P, InlineCode, Table } from '../components/DocsLayout'
import CodeBlock from '../components/CodeBlock'

const QUICK_LINKS = [
  { icon: Zap,          label: '퀵스타트',       desc: '5분 안에 첫 결제 연동', path: '/quickstart',    color: 'text-yellow-400 bg-yellow-500/10' },
  { icon: BookOpen,     label: '튜토리얼',        desc: '결제 연동 단계별 가이드', path: '/tutorial',    color: 'text-blue-400 bg-blue-500/10' },
  { icon: FlaskConical, label: '샌드박스',        desc: 'API 직접 호출 테스트',   path: '/sandbox',     color: 'text-emerald-400 bg-emerald-500/10' },
]

export default function DocsHome() {
  return (
    <DocsLayout
      title="PayCore 결제 연동 가이드"
      description="가맹점 서버에서 API 하나만 호출하면 결제가 처리됩니다. 카드·휴대폰·가상계좌·정기결제 모두 동일한 인터페이스."
      next={{ label: '퀵스타트', path: '/quickstart' }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path}
              className="p-5 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </Link>
          )
        })}
      </div>

      <H2>PayCore란?</H2>
      <P>
        PayCore는 <strong className="text-white">자체 결제 처리 엔진</strong>을 가진 PG(결제대행) 서비스입니다.
        가맹점은 외부 PG SDK(PortOne, 토스페이먼츠 등)를 별도로 연동할 필요 없이,
        PayCore API 하나만 호출하면 결제가 처리됩니다.
      </P>
      <Callout type="tip">
        카드 정보 처리, 승인 요청, Webhook 발송까지 PayCore가 전부 처리합니다.
        가맹점 서버에는 결제 결과만 전달됩니다.
      </Callout>

      <H2>결제 흐름</H2>
      <CodeBlock
        language="text"
        code={`[고객]              [가맹점 서버]              [PayCore]
  │                      │                          │
  │── 결제 요청 ─────────>│                          │
  │                      │── POST /api/v1/payments ─>│
  │                      │                          │── 결제 처리 (내부)
  │                      │<── PaymentResponse ───────│
  │<── 결제 완료 ─────────│                          │
  │                      │<── Webhook 알림 ───────────│`}
      />
      <P>
        가맹점이 해야 할 일은 <InlineCode>POST /api/v1/payments</InlineCode> 호출 하나입니다.
        그 이후는 PayCore가 처리하고 결과를 반환합니다.
      </P>

      <H2>지원 결제 수단</H2>
      <Table
        headers={['paymentMethod 값', '결제 수단', '설명']}
        rows={[
          [<InlineCode>CARD</InlineCode>,            '신용·체크카드',   '국내 카드 결제 처리'],
          [<InlineCode>MOBILE</InlineCode>,          '휴대폰 소액결제', '통신사 연동 소액결제'],
          [<InlineCode>VIRTUAL_ACCOUNT</InlineCode>, '가상계좌',       '/api/v1/virtual-accounts 전용 엔드포인트 사용'],
          [<InlineCode>BANK_TRANSFER</InlineCode>,   '계좌이체',       '실시간 계좌이체'],
        ]}
      />

      <H2>인증</H2>
      <P>
        가맹점 등록 시 발급된 <InlineCode>Merchant ID</InlineCode>와 <InlineCode>Secret Key</InlineCode>를
        모든 API 요청 헤더에 포함해야 합니다.
      </P>
      <CodeBlock
        language="http"
        code={`POST /api/v1/payments HTTP/1.1
X-Merchant-Id: test-merchant
X-Api-Key: test-secret-key-paycore
Content-Type: application/json`}
      />
      <Callout type="warning">
        Secret Key는 반드시 <strong>가맹점 서버(백엔드)</strong>에서만 사용하세요.
        브라우저(프론트엔드)에 노출되면 안 됩니다.
      </Callout>

      <H3>샌드박스 인증값</H3>
      <P>테스트 환경에서는 아래 고정값을 사용하세요. 별도 가맹점 등록 불필요.</P>
      <CodeBlock
        language="bash"
        code={`X-Merchant-Id: test-merchant
X-Api-Key:     test-secret-key-paycore`}
      />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link to="/tutorial"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-sm"
        >
          연동 튜토리얼 시작 <ArrowRight size={14} />
        </Link>
        <Link to="/sandbox" className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors text-sm">
          샌드박스에서 바로 테스트 →
        </Link>
      </div>
    </DocsLayout>
  )
}
