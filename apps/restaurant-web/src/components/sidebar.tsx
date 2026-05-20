'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Gift,
  QrCode,
  UserCircle,
  SignOut,
} from '@phosphor-icons/react'
import { createClient } from '@/../lib/supabase/client'

const navItems = [
  { href: '/validate', label: 'Validar', icon: QrCode },
  { href: '/benefits', label: 'Pratos', icon: Gift },
  { href: '/profile', label: 'Perfil', icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <aside
      className="flex w-full flex-col bg-[#1A1A2E] md:h-screen md:w-64 md:min-w-64 md:max-w-64 md:justify-between"
    >
      <div>
        <div className="flex items-center px-4 py-4 md:px-5 md:py-6">
          <span className="text-xl font-bold text-[#FF6B35] md:text-2xl">
            +um Restaurante
          </span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:mt-2 md:flex-col md:overflow-visible md:pb-0" aria-label="Navegacao do restaurante">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-lg border-l-[3px] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A2E] md:pl-5 ${
                  active
                    ? 'border-l-[#FF6B35] bg-[#FF6B35]/15 text-[#FF6B35]'
                    : 'border-l-transparent text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 px-3 pb-4">
        <div className="mx-2 mb-2 border-t border-white/10" />

        <button
          type="button"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="flex h-11 w-full items-center gap-3 rounded-lg border-l-[3px] border-l-transparent bg-transparent pl-5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A2E]"
        >
          <SignOut size={20} aria-hidden />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
