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
  { href: '/benefits', label: 'Itens', icon: Gift },
  { href: '/profile', label: 'Perfil', icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#292218] px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a89b8c]">
            Painel parceiro
          </p>
          <p className="font-serif text-xl italic leading-tight text-[#f4ede4]">+um Parceiro</p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          aria-label="Sair"
          title="Sair"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#332b20] bg-[#1b1710] text-[#c3b7a9] transition-colors hover:border-[#ff7657] hover:text-[#ff7657] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7657]"
        >
          <SignOut size={19} aria-hidden />
        </button>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[74px] w-full max-w-[480px] items-stretch justify-around border-t border-[#292218] bg-[#15110a]/95 px-3 backdrop-blur"
        aria-label="Navegação do parceiro"
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          const linkClass = 'flex min-w-[76px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7657] ' + (active ? 'text-[#ff7657]' : 'text-[#9d9284] hover:text-[#f4ede4]')
          const iconWrapClass = 'flex h-8 w-12 items-center justify-center rounded-full transition-colors ' + (active ? 'bg-[#3a2116]' : '')

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={linkClass}
            >
              <span className={iconWrapClass}>
                <item.icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
