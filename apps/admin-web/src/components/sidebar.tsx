'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChartBar,
  ForkKnife,
  Users,
  CreditCard,
  Bell,
  Buildings,
  Camera,
  SignOut,
  DotsThree,
  X,
  Fire,
} from '@phosphor-icons/react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: ChartBar },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/crm/email', label: 'E-mail', icon: Bell },
  { href: '/crm/email/desejo', label: 'Desejo +UM', icon: Fire },
  { href: '/influencers', label: 'Influencers', icon: Users },
  { href: '/restaurants', label: 'Parceiros', icon: ForkKnife },
  { href: '/users', label: 'Usuários', icon: Users },
  { href: '/subscriptions', label: 'Assinaturas', icon: CreditCard },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/social-proofs', label: 'Social Proofs', icon: Camera },
  { href: '/cities', label: 'Cidades', icon: Buildings },
]

const mobilePrimary = ['/', '/crm', '/crm/email', '/restaurants']

export function Sidebar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => setMoreOpen(false), [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/crm') return pathname === '/crm'
    if (href === '/crm/email') return pathname === '/crm/email'
    return pathname.startsWith(href)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const primary = navItems.filter((item) => mobilePrimary.includes(item.href))
  const secondary = navItems.filter((item) => !mobilePrimary.includes(item.href))

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/8 bg-[#17120b]/96 px-4 pb-5 pt-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <div className="flex items-end gap-2">
            <span className="font-display text-[2.25rem] leading-none text-[#f5edde]">+UM</span>
            <span className="mb-1 rounded-full border border-[#ff7a59]/25 bg-[#ff7a59]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff9a80]">admin</span>
          </div>
          <p className="mt-2 text-xs text-[#8e8268]">Operação, relacionamento e crescimento.</p>
        </div>

        <nav className="admin-scroll mt-7 flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`group flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium transition ${active ? 'bg-[#ff7a59] text-[#141008]' : 'text-[#b8ab94] hover:bg-white/5 hover:text-[#f5edde]'}`}>
                <item.icon size={19} weight={active ? 'fill' : 'regular'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button onClick={signOut} className="mt-4 flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium text-[#b8ab94] transition hover:bg-white/5 hover:text-[#f5edde]">
          <SignOut size={19} /> Sair
        </button>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-[#141008]/92 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <span className="font-display text-[1.8rem] leading-none text-[#f5edde]">+UM</span>
          <span className="rounded-full border border-[#ff7a59]/25 bg-[#ff7a59]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#ff9a80]">admin</span>
        </div>
        <div className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-[#b8ab94]">Operação</div>
      </header>

      <nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#141008]/96 px-2 pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primary.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition ${active ? 'bg-[#ff7a59]/12 text-[#ff8f72]' : 'text-[#8e8268]'}`}>
                <item.icon size={20} weight={active ? 'fill' : 'regular'} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setMoreOpen(true)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold ${secondary.some((item) => isActive(item.href)) ? 'bg-[#ff7a59]/12 text-[#ff8f72]' : 'text-[#8e8268]'}`}>
            <DotsThree size={22} weight="bold" /> Mais
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
          <section className="admin-bottom-nav absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[2rem] border-t border-white/10 bg-[#1e1810] px-4 pb-4 pt-3 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/10" />
            <div className="mb-3 flex items-center justify-between px-1">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ff8f72]">Mais áreas</p><h2 className="mt-1 text-xl font-semibold text-[#f5edde]">Admin +UM</h2></div>
              <button onClick={() => setMoreOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/8 bg-white/[0.035] text-[#b8ab94]"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {secondary.map((item) => {
                const active = isActive(item.href)
                return <Link key={item.href} href={item.href} className={`flex min-h-20 flex-col justify-between rounded-2xl border p-3 ${active ? 'border-[#ff7a59]/35 bg-[#ff7a59]/12 text-[#ff9a80]' : 'border-white/8 bg-white/[0.025] text-[#b8ab94]'}`}><item.icon size={21} weight={active ? 'fill' : 'regular'} /><span className="text-sm font-semibold">{item.label}</span></Link>
              })}
            </div>

            <button onClick={signOut} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] text-sm font-semibold text-[#b8ab94]"><SignOut size={18} /> Sair</button>
          </section>
        </div>
      ) : null}
    </>
  )
}
