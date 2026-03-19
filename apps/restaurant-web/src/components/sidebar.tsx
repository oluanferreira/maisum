'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar,
  Gift,
  QrCode,
  ChatCircle,
  Star,
  Camera,
  UserCircle,
  Gear,
  SignOut,
} from '@phosphor-icons/react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: ChartBar },
  { href: '/benefits', label: 'Beneficios', icon: Gift },
  { href: '/validate', label: 'Validar Cupom', icon: QrCode },
  { href: '/chat', label: 'Chat', icon: ChatCircle },
  { href: '/reviews', label: 'Avaliacoes', icon: Star },
  { href: '/social-proofs', label: 'Posts Sociais', icon: Camera },
  { href: '/profile', label: 'Perfil', icon: UserCircle },
]

const bottomItems = [
  { href: '/settings', label: 'Config', icon: Gear },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="flex h-screen w-64 flex-col justify-between"
      style={{ backgroundColor: '#1A1A2E', minWidth: 256, maxWidth: 256 }}
    >
      <div>
        {/* Logo */}
        <div className="flex items-center px-5 py-6">
          <span className="text-2xl font-bold" style={{ color: '#FF6B35' }}>
            +um Restaurante
          </span>
        </div>

        {/* Nav Links */}
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg transition-colors"
                style={{
                  height: 44,
                  paddingLeft: 20,
                  gap: 12,
                  borderRadius: 8,
                  backgroundColor: active ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: active ? '#FF6B35' : 'rgba(255,255,255,0.7)',
                  borderLeft: active ? '3px solid #FF6B35' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <item.icon size={20} weight={active ? 'fill' : 'regular'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 px-3 pb-4">
        {/* Separator */}
        <div
          className="mx-2 mb-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        />

        {bottomItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg transition-colors"
              style={{
                height: 44,
                paddingLeft: 20,
                gap: 12,
                borderRadius: 8,
                backgroundColor: active ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: active ? '#FF6B35' : 'rgba(255,255,255,0.7)',
                borderLeft: active ? '3px solid #FF6B35' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <item.icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Sign Out */}
        <button
          onClick={() => {
            // signOut action placeholder
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 rounded-lg transition-colors"
          style={{
            height: 44,
            paddingLeft: 20,
            gap: 12,
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            borderLeft: '3px solid transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <SignOut size={20} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
