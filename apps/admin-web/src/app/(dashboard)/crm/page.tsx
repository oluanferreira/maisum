'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type LifecycleStage = 'offer_active' | 'offer_expired' | 'first_use_done' | 'coupon_ready' | 'engaged' | 'registered' | 'customer'

type CrmContact = {
  user_id: string
  full_name: string | null
  email: string | null
  whatsapp_number: string | null
  created_at: string
  lifecycle_stage: LifecycleStage
  manual_status: string | null
  owner_note: string | null
  next_follow_up_at: string | null
  last_whatsapp_opened_at: string | null
  last_email_sent_at: string | null
  do_not_contact_email: boolean
  do_not_contact_whatsapp: boolean
  email_opt_in: boolean
  whatsapp_opt_in: boolean
  influencer_name: string | null
  influencer_slug: string | null
  campaign_key: string | null
  last_use_at: string | null
  last_purchase_at: string | null
  offer_expires_at: string | null
  priority_score: number
}

const stageMeta: Record<LifecycleStage, { label: string; className: string; helper: string }> = {
  offer_active: { label: 'Oferta R$47 ativa', className: 'bg-orange-100 text-orange-800', helper: 'Usou o primeiro +UM e está dentro das 24h.' },
  offer_expired: { label: 'Oferta expirou', className: 'bg-amber-100 text-amber-800', helper: 'Usou o +UM, mas não converteu dentro da janela.' },
  first_use_done: { label: 'Primeiro uso feito', className: 'bg-purple-100 text-purple-800', helper: 'Já percebeu valor e está quente para follow-up.' },
  coupon_ready: { label: 'Cupom disponível', className: 'bg-blue-100 text-blue-800', helper: 'Recebeu o cupom e ainda precisa usar.' },
  engaged: { label: 'Engajado', className: 'bg-cyan-100 text-cyan-800', helper: 'Já usou o +UM, sem assinatura ativa.' },
  registered: { label: 'Cadastrado', className: 'bg-neutral-100 text-neutral-700', helper: 'Entrou no +UM, mas ainda não avançou no funil.' },
  customer: { label: 'Assinante', className: 'bg-emerald-100 text-emerald-800', helper: 'Cliente ativo. Prioridade é retenção e newsletter.' },
}

const filters: Array<{ value: '' | LifecycleStage; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'offer_active', label: 'R$47 ativa' },
  { value: 'offer_expired', label: 'Oferta expirou' },
  { value: 'coupon_ready', label: 'Cupom disponível' },
  { value: 'registered', label: 'Cadastrados' },
  { value: 'customer', label: 'Assinantes' },
]

export default function CrmPage() {
  const supabase = useMemo(() => createClient(), [])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [stage, setStage] = useState<'' | LifecycleStage>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadContacts() }, [stage])

  async function loadContacts() {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('get_crm_contacts', { p_stage: stage || null, p_limit: 500 })
    if (rpcError) {
      console.error(rpcError)
      setError('Não foi possível carregar o CRM agora.')
      setContacts([])
    } else setContacts((data ?? []) as CrmContact[])
    setLoading(false)
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return contacts
    return contacts.filter((c) => [c.full_name, c.email, c.whatsapp_number, c.influencer_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)))
  }, [contacts, search])

  const metrics = useMemo(() => ({
    activeOffer: contacts.filter((c) => c.lifecycle_stage === 'offer_active').length,
    ready: contacts.filter((c) => c.lifecycle_stage === 'coupon_ready').length,
    customers: contacts.filter((c) => c.lifecycle_stage === 'customer').length,
    actionable: contacts.filter((c) => c.lifecycle_stage !== 'customer' && c.whatsapp_opt_in && c.whatsapp_number && !c.do_not_contact_whatsapp).length,
  }), [contacts])

  async function openWhatsApp(contact: CrmContact) {
    if (!contact.whatsapp_number || !contact.whatsapp_opt_in || contact.do_not_contact_whatsapp) return
    setBusyId(contact.user_id)
    await supabase.rpc('crm_mark_contact_event', {
      p_user_id: contact.user_id,
      p_channel: 'whatsapp',
      p_event_type: 'whatsapp_opened',
      p_metadata: { lifecycle_stage: contact.lifecycle_stage },
    })
    window.open(`https://wa.me/${normalizePhone(contact.whatsapp_number)}?text=${encodeURIComponent(whatsappMessage(contact))}`, '_blank', 'noopener,noreferrer')
    setBusyId(null)
    void loadContacts()
  }

  async function setFollowUpTomorrow(contact: CrmContact) {
    setBusyId(contact.user_id)
    await supabase.rpc('crm_update_contact', {
      p_user_id: contact.user_id,
      p_manual_status: 'follow_up',
      p_owner_note: contact.owner_note,
      p_next_follow_up_at: new Date(Date.now() + 86400000).toISOString(),
    })
    setBusyId(null)
    void loadContacts()
  }

  async function updateStatus(contact: CrmContact, status: string) {
    setBusyId(contact.user_id)
    await supabase.rpc('crm_update_contact', {
      p_user_id: contact.user_id,
      p_manual_status: status,
      p_owner_note: contact.owner_note,
      p_next_follow_up_at: contact.next_follow_up_at,
    })
    setBusyId(null)
    void loadContacts()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Relacionamento +UM</p>
          <h1 className="mt-1 text-3xl font-bold text-neutral-950">CRM de usuários</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">Usuários classificados automaticamente pelo comportamento no +UM, com fila de WhatsApp e base pronta para campanhas por e-mail.</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"><strong>{metrics.actionable}</strong> contatos disponíveis para abordagem por WhatsApp.</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Oferta R$47 ativa" value={metrics.activeOffer} helper="Maior prioridade agora" />
        <Metric label="Cupom ainda não usado" value={metrics.ready} helper="Ativar primeiro uso" />
        <Metric label="Para abordar" value={metrics.actionable} helper="Com opt-in de WhatsApp" />
        <Metric label="Assinantes" value={metrics.customers} helper="Retenção e newsletter" />
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button key={filter.value || 'all'} type="button" onClick={() => setStage(filter.value)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium ${stage === filter.value ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{filter.label}</button>
            ))}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome, e-mail, WhatsApp ou influencer" className="h-11 w-full rounded-xl border border-neutral-300 px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 lg:max-w-md" />
        </div>
      </section>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white py-14 text-center text-neutral-500">Carregando CRM...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white py-14 text-center text-neutral-500">Nenhum contato neste segmento.</div>
      ) : (
        <div className="grid gap-3">
          {visible.map((contact) => {
            const meta = stageMeta[contact.lifecycle_stage] ?? stageMeta.registered
            const canWhatsApp = Boolean(contact.whatsapp_number && contact.whatsapp_opt_in && !contact.do_not_contact_whatsapp)
            return (
              <article key={contact.user_id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-neutral-950">{contact.full_name || 'Usuário sem nome'}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      {contact.influencer_name ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">Origem: {contact.influencer_name}</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{meta.helper}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-700">
                      <span>{contact.email || 'Sem e-mail'}</span>
                      <span>{contact.whatsapp_number || 'Sem WhatsApp'}</span>
                      {contact.last_use_at ? <span>Último uso: {formatDate(contact.last_use_at)}</span> : null}
                      {contact.offer_expires_at && contact.lifecycle_stage === 'offer_active' ? <span className="font-medium text-orange-700">Oferta expira {formatRelative(contact.offer_expires_at)}</span> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <ConsentBadge active={contact.email_opt_in && !contact.do_not_contact_email} label="E-mail" />
                      <ConsentBadge active={contact.whatsapp_opt_in && !contact.do_not_contact_whatsapp} label="WhatsApp" />
                      {contact.next_follow_up_at ? <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">Follow-up {formatRelative(contact.next_follow_up_at)}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
                    <select value={contact.manual_status || 'open'} onChange={(e) => void updateStatus(contact, e.target.value)} disabled={busyId === contact.user_id} className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700">
                      <option value="open">Aberto</option><option value="contacted">Contactado</option><option value="follow_up">Follow-up</option><option value="won">Convertido</option><option value="lost">Perdido</option><option value="paused">Pausado</option>
                    </select>
                    <button type="button" onClick={() => void setFollowUpTomorrow(contact)} disabled={busyId === contact.user_id} className="h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Follow +1d</button>
                    <button type="button" onClick={() => void openWhatsApp(contact)} disabled={!canWhatsApp || busyId === contact.user_id} className="h-11 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500" title={canWhatsApp ? 'Abrir WhatsApp com mensagem contextual' : 'WhatsApp indisponível ou sem opt-in'}>{canWhatsApp ? 'Abordar no WhatsApp' : 'Sem opt-in WhatsApp'}</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">{value}</p><p className="mt-1 text-xs text-neutral-400">{helper}</p></div>
}

function ConsentBadge({ active, label }: { active: boolean; label: string }) {
  return <span className={`rounded-full px-2.5 py-1 font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{label}: {active ? 'opt-in' : 'não autorizado'}</span>
}

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  return digits
}

function whatsappMessage(contact: CrmContact) {
  const first = contact.full_name?.trim().split(/\s+/)[0]
  const greeting = first ? `Oi, ${first}!` : 'Oi!'
  switch (contact.lifecycle_stage) {
    case 'offer_active': return `${greeting} Aqui é do +UM 😊 Depois de usar seu primeiro +UM, sua condição anual de R$ 47 está liberada por 24h. Se quiser, te mando o caminho para aproveitar por aqui.`
    case 'offer_expired': return `${greeting} Aqui é do +UM 😊 Como foi sua primeira experiência? Queria ouvir você e também te avisar quando surgir uma nova condição especial para continuar usando o +UM.`
    case 'first_use_done': return `${greeting} Aqui é do +UM 😊 Agora que você já viu como funciona na prática, queria saber como foi sua experiência e te mostrar a melhor forma de continuar aproveitando.`
    case 'coupon_ready': return `${greeting} Seu cupom +UM já está disponível 😊 Você escolhe onde usar, pede 1 e ganha +1. Quer que eu te indique algumas opções para aproveitar?`
    case 'engaged': return `${greeting} Aqui é do +UM 😊 Você já aproveitou uma experiência. Quer que eu te mostre outras opções boas para usar na cidade?`
    case 'customer': return `${greeting} Aqui é do +UM 😊 Passando para saber como está sua experiência com o clube e se posso te indicar novidades entre os parceiros.`
    default: return `${greeting} Bem-vindo ao +UM 😊 A ideia é simples: você escolhe uma experiência, pede 1 e ganha +1. Se quiser, te ajudo a começar.`
  }
}

function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)) }
function formatRelative(value: string) {
  const hours = Math.round((new Date(value).getTime() - Date.now()) / 3600000)
  if (Math.abs(hours) < 1) return 'agora'
  if (hours > 0 && hours < 24) return `em ${hours}h`
  if (hours < 0 && hours > -24) return `há ${Math.abs(hours)}h`
  const days = Math.round(hours / 24)
  return days > 0 ? `em ${days}d` : `há ${Math.abs(days)}d`
}
