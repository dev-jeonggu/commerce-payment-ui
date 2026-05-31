import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'

const NAV_LINKS = [
  { to: '/tutorial', label: '튜토리얼' },
  { to: '/guide/payment', label: '연동 가이드' },
  { to: '/reference', label: 'API 레퍼런스' },
  { to: '/sandbox', label: '샌드박스' },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isGuide = location.pathname.startsWith('/guide')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between lg:pl-64">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-white text-base">PayCore</span>
          <span className="hidden sm:inline text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">Docs</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === link.to || (link.to === '/guide/payment' && isGuide)
                  ? 'bg-blue-600/10 text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/swagger-ui.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
          >
            Swagger UI ↗
          </a>
          <button className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === link.to
                  ? 'bg-blue-600/10 text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
