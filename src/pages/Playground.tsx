import { useState } from 'react'
import { Loader2, Send, ChevronDown, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { apiClient } from '../api/client'
import { generateMerchantOrderId } from '../api/orders'

// ─── 엔드포인트 정의 ──────────────────────────────────────────
const ENDPOINTS = [
  {
    group: '결제',
    items: [
      {
        id: 'create-payment',
        method: 'POST',
        path: '/api/v1/payments',
        label: '결제 생성',
        desc: '가맹점 주문에 대한 결제를 생성하고 처리합니다.',
        defaultBody: () => JSON.stringify({
          merchantId: 'test-merchant',
          merchantOrderId: generateMerchantOrderId(),
          amount: 30000,
          paymentMethod: 'CARD',
          orderName: 'MacBook Air M3',
        }, null, 2),
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
      {
        id: 'get-payment',
        method: 'GET',
        path: '/api/v1/payments/{merchantOrderId}',
        label: '결제 조회',
        desc: '주문번호로 결제 정보를 조회합니다.',
        pathParam: { key: 'merchantOrderId', placeholder: 'ORD-20260531-XXXXX' },
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
      {
        id: 'cancel-payment',
        method: 'POST',
        path: '/api/v1/payments/cancel',
        label: '결제 취소',
        desc: '전액 또는 부분 취소합니다. amount 생략 시 전액 취소.',
        defaultBody: () => JSON.stringify({
          merchantOrderId: '',
          reason: '고객 요청',
        }, null, 2),
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
    ],
  },
  {
    group: '가상계좌',
    items: [
      {
        id: 'issue-va',
        method: 'POST',
        path: '/api/v1/virtual-accounts',
        label: '가상계좌 발급',
        desc: '고객에게 가상계좌를 발급합니다. 입금 확인은 Webhook으로 수신됩니다.',
        defaultBody: () => JSON.stringify({
          merchantId: 'test-merchant',
          merchantOrderId: generateMerchantOrderId(),
          amount: 50000,
          bankCode: '004',
          holderName: '홍길동',
        }, null, 2),
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
    ],
  },
  {
    group: '빌링키 (정기결제)',
    items: [
      {
        id: 'register-billing',
        method: 'POST',
        path: '/api/v1/billing-keys',
        label: '빌링키 등록',
        desc: 'PG사 customer_uid를 등록합니다. AES-256 암호화로 저장됩니다.',
        defaultBody: () => JSON.stringify({
          merchantId: 'test-merchant',
          customerId: 'customer-001',
          pgBillingKey: 'customer_uid_example',
        }, null, 2),
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
      {
        id: 'charge-billing',
        method: 'POST',
        path: '/api/v1/billing-keys/charge',
        label: '빌링키 결제',
        desc: '등록된 빌링키로 즉시 결제를 처리합니다.',
        defaultBody: () => JSON.stringify({
          merchantId: 'test-merchant',
          billingKeyId: 1,
          merchantOrderId: generateMerchantOrderId(),
          amount: 9900,
          orderName: '월정액 구독',
        }, null, 2),
        headers: { 'X-Merchant-Id': 'test-merchant', 'X-Api-Key': 'test-secret-key-paycore' },
      },
    ],
  },
  {
    group: '가맹점',
    items: [
      {
        id: 'create-merchant',
        method: 'POST',
        path: '/api/v1/merchants',
        label: '가맹점 등록',
        desc: '새 가맹점을 등록하고 Merchant ID · Secret Key를 발급받습니다.',
        defaultBody: () => JSON.stringify({
          merchantId: 'my-new-shop',
          webhookUrl: 'https://my-shop.com/webhook/payment',
          webhookSecret: 'my-webhook-secret',
        }, null, 2),
        headers: {},
      },
    ],
  },
]

interface EndpointDef {
  id: string
  method: string
  path: string
  label: string
  desc: string
  defaultBody?: () => string
  headers: Record<string, string>
  pathParam?: { key: string; placeholder: string }
}

function methodColor(method: string) {
  if (method === 'GET') return 'bg-blue-500/20 text-blue-400'
  if (method === 'DELETE') return 'bg-red-500/20 text-red-400'
  return 'bg-emerald-500/20 text-emerald-400'
}

function StatusBadge({ status }: { status: number }) {
  const ok = status >= 200 && status < 300
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
      {status}
    </span>
  )
}

function EndpointPanel({ ep }: { ep: EndpointDef }) {
  const [body, setBody] = useState(() => ep.defaultBody ? ep.defaultBody() : '')
  const [pathParam, setPathParam] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{ status: number; data: unknown } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const hasBody = ep.method !== 'GET'
  const hasPathParam = !!ep.pathParam

  const send = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    setOpen(true)

    let url = ep.path
    if (hasPathParam && ep.pathParam) {
      url = url.replace(`{${ep.pathParam.key}}`, encodeURIComponent(pathParam))
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...ep.headers,
      }

      const config: Parameters<typeof apiClient.request>[0] = {
        method: ep.method,
        url,
        headers,
      }
      if (hasBody && body.trim()) {
        config.data = JSON.parse(body)
      }

      const res = await apiClient.request(config)
      setResponse({ status: res.status, data: res.data })
    } catch (e: unknown) {
      const axiosErr = e as { response?: { status: number; data: unknown }; message: string }
      if (axiosErr.response) {
        setResponse({ status: axiosErr.response.status, data: axiosErr.response.data })
      } else {
        setError(axiosErr.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 bg-gray-900/60">
        <span className={`text-xs font-bold font-mono px-2 py-1 rounded shrink-0 ${methodColor(ep.method)}`}>
          {ep.method}
        </span>
        <code className="text-sm text-gray-200 font-mono flex-1 truncate">{ep.path}</code>
        <span className="text-xs text-gray-500 hidden sm:inline">{ep.label}</span>
      </div>

      <div className="p-4 space-y-4 bg-gray-950/40">
        <p className="text-xs text-gray-500">{ep.desc}</p>

        {/* 인증 헤더 표시 */}
        {Object.keys(ep.headers).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">인증 헤더</p>
            {Object.entries(ep.headers).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-blue-400">{k}:</span>
                <span className="text-emerald-400">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Path Parameter */}
        {hasPathParam && ep.pathParam && (
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">
              경로 파라미터: <span className="text-blue-400">{ep.pathParam.key}</span>
            </label>
            <input
              value={pathParam}
              onChange={(e) => setPathParam(e.target.value)}
              placeholder={ep.pathParam.placeholder}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}

        {/* Request Body */}
        {hasBody && (
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Request Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-gray-500 resize-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* Send 버튼 */}
        <button
          onClick={send}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          요청 전송
        </button>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <XCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        {/* 응답 */}
        {response && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Response</p>
              <StatusBadge status={response.status} />
              {response.status >= 200 && response.status < 300
                ? <CheckCircle size={12} className="text-emerald-400" />
                : <XCircle size={12} className="text-red-400" />}
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-800">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <span className="text-xs text-gray-600 font-mono">json</span>
                <button
                  onClick={() => setOpen(!open)}
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                >
                  {open ? '접기' : '펼치기'}
                  <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {open && (
                <pre className="bg-gray-950 p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-80 overflow-y-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sandbox() {
  const [activeGroup, setActiveGroup] = useState(ENDPOINTS[0].group)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const activeEndpoints = ENDPOINTS.find((g) => g.group === activeGroup)?.items ?? []

  return (
    <div className="lg:ml-60">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
        {/* 헤더 */}
        <div className="mb-10 pb-8 border-b border-gray-800/60">
          <h1 className="text-3xl font-bold text-white mb-3">샌드박스</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            PayCore API를 직접 호출해서 요청·응답을 확인하세요.
            튜토리얼에서 설명하는 모든 엔드포인트를 여기서 테스트할 수 있습니다.
          </p>
        </div>

        {/* 인증 정보 */}
        <div className="mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-3">샌드박스 인증 정보</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex gap-2">
              <span className="text-gray-500">X-Merchant-Id</span>
              <span className="text-emerald-400">test-merchant</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500">X-Api-Key</span>
              <span className="text-emerald-400">test-secret-key-paycore</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">위 값이 모든 요청에 자동으로 포함됩니다.</p>
        </div>

        {/* 결제 후 주문번호 복사 안내 */}
        {lastOrderId && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span className="text-emerald-300">
              마지막 주문번호: <code className="font-mono">{lastOrderId}</code> — 조회·취소 테스트에 사용하세요.
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(lastOrderId)}
              className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 shrink-0"
            >
              복사
            </button>
          </div>
        )}

        {/* 그룹 탭 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ENDPOINTS.map((g) => (
            <button
              key={g.group}
              onClick={() => setActiveGroup(g.group)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeGroup === g.group
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {g.group}
            </button>
          ))}
        </div>

        {/* 엔드포인트 패널들 */}
        <div className="space-y-4">
          {activeEndpoints.map((ep) => (
            <div
              key={ep.id}
              onClick={() => {
                // 결제 생성 후 주문번호 추적
                if (ep.id === 'create-payment' && ep.defaultBody) {
                  try {
                    const parsed = JSON.parse(ep.defaultBody())
                    setLastOrderId(parsed.merchantOrderId)
                  } catch { /* ignore */ }
                }
              }}
            >
              <EndpointPanel ep={ep} />
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="mt-10 p-5 rounded-xl border border-gray-800 bg-gray-900/30">
          <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <RotateCcw size={14} className="text-blue-400" />
            테스트 순서 추천
          </p>
          <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
            <li><span className="text-white">결제 생성</span> — 응답의 <code className="text-blue-400">merchantOrderId</code> 복사</li>
            <li><span className="text-white">결제 조회</span> — 복사한 주문번호로 상태 확인</li>
            <li><span className="text-white">결제 취소</span> — 동일 주문번호로 취소 처리</li>
            <li><span className="text-white">가상계좌 발급</span> — 입금 대기 상태 확인</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
