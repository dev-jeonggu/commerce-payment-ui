import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'

export interface NavItem {
  label: string
  path?: string
  children?: NavItem[]
  badge?: string
}

export const NAV_TREE: NavItem[] = [
  {
    label: '시작하기',
    children: [
      { label: '개요', path: '/' },
      { label: '퀵스타트', path: '/quickstart' },
    ],
  },
  {
    label: '튜토리얼',
    children: [
      { label: '결제창 연동하기', path: '/tutorial', badge: '추천' },
    ],
  },
  {
    label: '연동 가이드',
    children: [
      { label: '결제 요청', path: '/guide/payment' },
      { label: '결제 취소 · 환불', path: '/guide/cancel' },
      { label: 'Webhook 연동', path: '/guide/webhook' },
      { label: '가상계좌', path: '/guide/virtual-account' },
      { label: '정기결제 (빌링키)', path: '/guide/billing' },
    ],
  },
  {
    label: 'API 레퍼런스',
    children: [
      { label: 'REST API', path: '/reference' },
    ],
  },
  {
    label: '샌드박스',
    path: '/sandbox',
  },
]

function SidebarItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => c.path === location.pathname || c.children?.some((cc) => cc.path === location.pathname))
    }
    return false
  })

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800/40"
        >
          {item.label}
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <SidebarItem key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path!}
      className={({ isActive }) =>
        `flex items-center justify-between pl-${depth > 0 ? 5 : 3} pr-3 py-1.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-blue-500/15 text-blue-400 font-medium'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`
      }
      style={{ paddingLeft: depth > 0 ? '1.25rem' : '0.75rem' }}
    >
      {item.label}
      {item.badge && (
        <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}

interface DocsLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  prev?: { label: string; path: string }
  next?: { label: string; path: string }
}

export default function DocsLayout({ children, title, description, prev, next }: DocsLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* 모바일 토글 */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
      </button>

      {/* 사이드바 */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-60 border-r border-gray-800/60 bg-gray-950 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-2">
          {NAV_TREE.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </nav>
      </aside>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-60 flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
          {/* 페이지 헤더 */}
          <div className="mb-10 pb-8 border-b border-gray-800/60">
            <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
            {description && <p className="text-gray-400 text-lg leading-relaxed">{description}</p>}
          </div>

          {/* 본문 */}
          <div className="prose-docs">
            {children}
          </div>

          {/* 이전/다음 네비게이션 */}
          {(prev || next) && (
            <div className="mt-16 pt-8 border-t border-gray-800/60 flex justify-between gap-4">
              {prev ? (
                <NavLink to={prev.path} className="flex flex-col gap-1 p-4 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900 transition-all max-w-xs">
                  <span className="text-xs text-gray-500">← 이전</span>
                  <span className="text-sm font-medium text-white">{prev.label}</span>
                </NavLink>
              ) : <div />}
              {next ? (
                <NavLink to={next.path} className="flex flex-col gap-1 p-4 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900 transition-all text-right max-w-xs ml-auto">
                  <span className="text-xs text-gray-500">다음 →</span>
                  <span className="text-sm font-medium text-white">{next.label}</span>
                </NavLink>
              ) : <div />}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── 공통 문서 컴포넌트들 ─────────────────────────────────────

export function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip' | 'danger'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   icon: 'ℹ️' },
    warning: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-300',  icon: '⚠️' },
    tip:     { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-300',icon: '💡' },
    danger:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-300',    icon: '🚨' },
  }
  const s = styles[type]
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-4 my-5`}>
      <p className={`text-sm leading-relaxed ${s.text}`}>
        <span className="mr-2">{s.icon}</span>
        {children}
      </p>
    </div>
  )
}

export function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-12 pb-10 last:pb-0">
      <div className="absolute left-0 top-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 z-10">
          {number}
        </div>
        <div className="w-px flex-1 bg-gray-800 mt-2" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-white mt-12 mb-5 first:mt-0">{children}</h2>
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-white mt-8 mb-3">{children}</h3>
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 leading-relaxed my-3">{children}</p>
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
}

export function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-800">
            {headers.map((h) => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-900/40 transition-colors">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
