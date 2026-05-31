import { useState, useCallback } from 'react'
import { Bell, CheckCircle, AlertTriangle, Loader2, RefreshCw, Send, Shield, XCircle } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

interface MockWebhookLog {
  id: string
  impUid: string
  merchantUid: string
  status: string
  receivedAt: string
  trusted: boolean
  verified: boolean
  pgVerified: boolean
  processingMs: number
}

const generateId = () => Math.random().toString(36).slice(2, 10)
const generateImpUid = () => `imp_${Date.now().toString().slice(-9)}`
const generateOrderNo = () => `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${generateId().toUpperCase()}`

const INITIAL_LOGS: MockWebhookLog[] = [
  {
    id: generateId(),
    impUid: 'imp_123456789',
    merchantUid: 'ORD-20260520-DEMO01',
    status: 'paid',
    receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    trusted: false,
    verified: true,
    pgVerified: true,
    processingMs: 127,
  },
  {
    id: generateId(),
    impUid: 'imp_987654321',
    merchantUid: 'ORD-20260520-DEMO02',
    status: 'paid',
    receivedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    trusted: false,
    verified: true,
    pgVerified: true,
    processingMs: 98,
  },
  {
    id: generateId(),
    impUid: 'imp_111222333',
    merchantUid: 'ORD-20260520-DEMO03',
    status: 'cancelled',
    receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    trusted: false,
    verified: true,
    pgVerified: true,
    processingMs: 145,
  },
]

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const WEBHOOK_PAYLOAD_EXAMPLE = `{
  "imp_uid": "imp_123456789",
  "merchant_uid": "ORD-20260520-ABC123",
  "status": "paid"
}`

const WEBHOOK_PROCESSING = `// PaymentController.java
@PostMapping("/webhook")
public ApiResponse<Void> receiveWebhook(
    @RequestBody PaymentWebhookRequest request) {
  log.info("[Webhook] 수신 - merchantUid: {}",
      request.getMerchantUid());

  // ⚠️ Webhook 내용은 신뢰하지 않음
  // imp_uid로 PG API를 직접 재조회
  paymentService.processWebhook(
      request.getImpUid(),
      request.getMerchantUid()
  );

  // 중복 수신해도 200 반환 (멱등성 보장)
  return ApiResponse.success("처리 완료", null);
}`

export default function WebhookLogs() {
  const [logs, setLogs] = useState<MockWebhookLog[]>(INITIAL_LOGS)
  const [simImpUid, setSimImpUid] = useState('')
  const [simMerchantUid, setSimMerchantUid] = useState('')
  const [simStatus, setSimStatus] = useState('paid')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedLog, setSelectedLog] = useState<MockWebhookLog | null>(null)

  const handleSimulate = useCallback(async () => {
    const impUid = simImpUid || generateImpUid()
    const merchantUid = simMerchantUid || generateOrderNo()
    setSending(true)
    setSendResult(null)

    // 은행 Webhook 엔드포인트는 내부 전용(X-Internal-Token)이므로 프론트에서 직접 호출하지 않음.
    // 실제 운영에서는 은행/내부 시스템이 POST /api/v1/payments/webhook/bank 로 호출.
    await new Promise((r) => setTimeout(r, 600))
    const newLog: MockWebhookLog = {
      id: generateId(),
      impUid,
      merchantUid,
      status: simStatus,
      receivedAt: new Date().toISOString(),
      trusted: false,
      verified: true,
      pgVerified: true,
      processingMs: Math.floor(80 + Math.random() * 150),
    }
    setLogs((prev) => [newLog, ...prev])
    setSendResult({ success: true, message: '[로컬 시뮬레이션] 로그 추가 완료 — 실제 전송은 내부 시스템에서 수행됩니다.' })
    setSending(false)
  }, [simImpUid, simMerchantUid, simStatus])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Webhook 로그</h1>
        <p className="text-gray-400">
          PG사로부터 수신되는 Webhook 이벤트를 확인하고 시뮬레이션합니다.
          <br className="hidden sm:inline" />
          Webhook 내용은 절대 신뢰하지 않으며, PG API를 통해 재검증합니다.
        </p>
      </div>

      {/* Key Principle Banner */}
      <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8">
        <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300 mb-1">Webhook 처리 원칙</p>
          <ul className="text-sm text-amber-400/70 space-y-1">
            <li>• Webhook 수신 내용(status, amount 등)은 절대 신뢰하지 않습니다.</li>
            <li>• 수신 즉시 <code className="text-amber-300">imp_uid</code>로 PortOne API를 직접 조회하여 실제 상태를 확인합니다.</li>
            <li>• 중복 Webhook이 수신되어도 멱등성을 보장하여 항상 200을 반환합니다.</li>
            <li>• Webhook 유실을 대비해 5분 주기 스케줄러가 PENDING 주문을 자동 복구합니다.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Log Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Log Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-400" />
              <span className="font-semibold text-white">수신 로그</span>
              <span className="badge bg-gray-800 text-gray-400">{logs.length}</span>
            </div>
            <button
              onClick={() => setLogs(INITIAL_LOGS)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw size={12} />
              초기화
            </button>
          </div>

          {/* Log List */}
          <div className="space-y-2">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`w-full card p-4 text-left hover:border-gray-700 transition-all ${
                  selectedLog?.id === log.id ? 'border-gray-600 bg-gray-800/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                        log.pgVerified ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge border text-xs ${STATUS_STYLES[log.status] || STATUS_STYLES.ready}`}>
                          {log.status}
                        </span>
                        {log.pgVerified ? (
                          <span className="badge bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                            PG 재검증 완료
                          </span>
                        ) : (
                          <span className="badge bg-red-500/10 border-red-500/30 text-red-400 text-xs">
                            검증 실패
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 font-mono truncate">{log.merchantUid}</p>
                      <p className="text-xs text-gray-600 font-mono truncate">{log.impUid}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{formatTime(log.receivedAt)}</p>
                    <p className="text-xs text-gray-600">{formatDate(log.receivedAt)}</p>
                    {log.processingMs > 0 && (
                      <p className="text-xs text-gray-600">{log.processingMs}ms</p>
                    )}
                  </div>
                </div>

                {selectedLog?.id === log.id && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'imp_uid', value: log.impUid },
                        { label: 'merchant_uid', value: log.merchantUid },
                        { label: 'status (Webhook)', value: log.status },
                        { label: 'Webhook 신뢰', value: '❌ 신뢰 안함 (재조회)' },
                        { label: 'PG API 재검증', value: log.pgVerified ? '✅ 완료' : '❌ 실패' },
                        { label: '처리 시간', value: log.processingMs ? `${log.processingMs}ms` : '-' },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-950 rounded p-2">
                          <p className="text-gray-600 mb-0.5">{item.label}</p>
                          <p className="text-gray-300 font-mono break-all">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Simulate Webhook */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Send size={14} className="text-blue-400" />
              Webhook 시뮬레이션
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">imp_uid (비워두면 자동생성)</label>
                <input
                  type="text"
                  value={simImpUid}
                  onChange={(e) => setSimImpUid(e.target.value)}
                  placeholder="imp_..."
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">merchant_uid (비워두면 자동생성)</label>
                <input
                  type="text"
                  value={simMerchantUid}
                  onChange={(e) => setSimMerchantUid(e.target.value)}
                  placeholder="ORD-..."
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">status</label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-gray-500"
                >
                  <option value="paid">paid</option>
                  <option value="cancelled">cancelled</option>
                  <option value="failed">failed</option>
                  <option value="ready">ready</option>
                </select>
              </div>

              <button
                onClick={handleSimulate}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {sending ? (
                  <><Loader2 size={14} className="animate-spin" /> 전송 중...</>
                ) : (
                  <><Send size={14} /> Webhook 전송</>
                )}
              </button>

              {sendResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                    sendResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-orange-500/10 border border-orange-500/30 text-orange-300'
                  }`}
                >
                  {sendResult.success ? (
                    <CheckCircle size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {sendResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Webhook Payload Structure */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Webhook 페이로드 구조</p>
            <CodeBlock code={WEBHOOK_PAYLOAD_EXAMPLE} language="json" />
            <p className="text-xs text-gray-600 mt-2">
              * status는 참고용. PG API 재조회로 실제 상태를 확인합니다.
            </p>
          </div>

          {/* Security: Verification */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield size={12} />
              서버 처리 코드
            </p>
            <CodeBlock code={WEBHOOK_PROCESSING} language="java" />
          </div>
        </div>
      </div>
    </div>
  )
}
