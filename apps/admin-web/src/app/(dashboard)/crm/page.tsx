'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CommercialFunnel = 'first_plusum' | 'passport'
type CommercialStage =
  | 'first_plusum_eligible'
  | 'first_plusum_ready'
  | 'first_plusum_expired'
  | 'passport_offer_active'
  | 'passport_offer_expired'
  | 'passport_recovery'
  | 'passport_active'

type CrmContact = {
  user_id: string
  full_name: string | null
  email: string | null
  whatsapp_number: string | null
  created_at: string
  lifecycle_stage: string
  commercial_funnel: CommercialFunnel
  commercial_stage: CommercialStage
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
  acquisition_offer_policy_key: string | null
  last_use_at: string | null
  last_purchase_at: string | null
  offer_expires_at: string | null
  offer_price_cents: number | null
  has_first_experience_redemption: boolean
  has_subscription_history: boolean
  has_usage_history: boolean
  priority_score: number
}

const stageMeta: Record<CommercialStage, { label: string; className: string; helper: string }> = {
  first_plusum_eligible: {
    label: 'A convidar',
    className: 'bg-sky-100 text-sky-800',
    helper: 'Nunca recebeu uma primeira experiência e pode entrar no Meu Primeiro +UM.',
  },
  first_plusum_ready: {
    label: 'Pronto para usar',
    className: 'bg-blue-100 text-blue-800',
    helper: 'O Meu Primeiro +UM já foi liberado. Agora o objetivo é fazer a pessoa usar.',
  },
  first_plusum_expired: {
    label: 'Primeiro +UM expirado',
    className: 'bg-slate-100 text-slate-700',
    helper: 'A primeira experiência já foi creditada e expirou. Não gerar uma segunda experiência.',
  },
  passport_offer_active: {
    label: 'Oferta 24h ativa',
    className: 'bg-orange-100 text-orange-800',
    helper: 'Usou o primeiro +UM e está na janela de ativação do Passaporte.',
  },
  passport_offer_expired: {
    label: 'Oferta 24h expirou',
    className: 'bg-amber-100 text-amber-800',
    helper: 'Já experimentou o +UM, mas não ativou o Passaporte dentro da janela especial.',
  },
  passport_recovery: {
    label: 'Recuperação',
    className: 'bg-purple-100 text-purple-800',
    helper: 'Já teve uso ou histórico de assinatura e está sem Passaporte ativo.',
  },
  passport_active: {
    label: 'Passaporte ativo',
    className: 'bg-emerald-100 text-emerald-800',
    helper: 'Cliente com acesso anual ativo. Sai do funil de aquisição.',
  },
}

const funnelMeta: Record<CommercialFunnel, { label: string; className: string }> = {
  first_plusum: { label: 'Meu Primeiro +UM', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  passport: { label: 'Passaporte', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
}

const stageFilters: Array<{ value: '' | CommercialStage; label: string; funnel?: CommercialFunnel }> = [
  { value: '', label: 'Todos os estágios' },
  { value: 'first_plusum_eligible', label: 'A convidar', funnel: 'first_plusum' },
  { value: 'first_plusum_ready', label: 'Prontos para usar', funnel: 'first_plusum' },
  { value: 'first_plusum_expired', label: 'Primeiro +UM expirado', funnel: 'first_plusum' },
  { value: 'passport_offer_active', label: 'Oferta 24h ativa', funnel: 'passport' },
  { value: 'passport_offer_expired', label: 'Oferta 24h expirou', funnel: 'passport' },
  { value: 'passport_recovery', label: 'Recuperação', funnel: 'passport' },
  { value: 'passport_active', label: 'Ativos', funnel: 'passport' },
]

export default function CrmPage() {
  const supabase = useMemo(() => createClient(), [])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [funnel, setFunnel] = useState<'' | CommercialFunnel>('')
  const [commercialStage, setCommercialStage] = useState<'' | CommercialStage>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadContacts() }, [])

  async function loadContacts() {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('get_crm_contacts_commercial', {
      p_funnel: null,
      p_commercial_stage: null,
      p_limit: 500,
    })
    if (rpcError) {
      console.error(rpcError)
      setError('Não foi possível carregar o CRM agora.')
      setContacts([])
    } else setContacts((data ?? []) as CrmContact[])
    setLoading(false)
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (funnel && contact.commercial_funnel !== funnel) return false
      if (commercialStage && contact.commercial_stage !== commercialStage) return false
      if (!term) return true
      return [contact.full_name, contact.email, contact.whatsapp_number, contact.influencer_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [contacts, funnel, commercialStage, search])

  const metrics = useMemo(() => ({
    firstEligible: contacts.filter((c) => c.commercial_stage === 'first_plusum_eligible').length,
    firstReady: contacts.filter((c) => c.commercial_stage === 'first_plusum_ready').length,
    passportConversion: contacts.filter((c) => ['passport_offer_active', 'passport_offer_expired', 'passport_recovery'].includes(c.commercial_stage)).length,
    passportActive: contacts.filter((c) => c.commercial_stage === 'passport_active').length,
    actionable: contacts.filter((c) => c.commercial_stage !== 'passport_active' && c.whatsapp_opt_in && c.whatsapp_number && !c.do_not_contact_whatsapp).length,
  }), [contacts])

  const availableStageFilters = useMemo(
    () => stageFilters.filter((filter) => !filter.funnel || !funnel || filter.funnel === funnel),
    [funnel],
  )

  function chooseFunnel(next: '' | CommercialFunnel) {
    setFunnel(next)
    if (commercialStage) {
      const selected = stageFilters.find((item) => item.value === commercialStage)
      if (next && selected?.funnel && selected.funnel !== next) setCommercialStage('')
    }
  }

  async function openWhatsApp(contact: CrmContact) {
    if (!contact.whatsapp_number || !contact.whatsapp_opt_in || contact.do_not_contact_whatsapp) return
    setBusyId(contact.user_id)
    await supabase.rpc('crm_mark_contact_event', {
      p_user_id: contact.user_id,
      p_channel: 'whatsapp',
      p_event_type: 'whatsapp_opened',
      p_metadata: {
        lifecycle_stage: contact.lifecycle_stage,
        commercial_funnel: contact.commercial_funnel,
        commercial_stage: contact.commercial_stage,
      },
    })
    window.open(`https://wa.me/${normalizePhone(contact.whatsapp_number)}`, '_blank', 'noopener,noreferrer')
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
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">Aquisição organizada em dois funis: <strong>Meu Primeiro +UM</strong> para fazer a pessoa experimentar e <strong>Passaporte</strong> para transformar uso em acesso anual.</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"><strong>{metrics.actionable}</strong> contatos disponíveis para abordagem por WhatsApp.</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Meu Primeiro +UM" value={metrics.firstEligible} helper="Elegíveis para receber a 1ª experiência" />
        <Metric label="Prontos para usar" value={metrics.firstReady} helper="Já receberam o primeiro +UM" />
        <Metric label="Passaporte a converter" value={metrics.passportConversion} helper="Oferta ativa, expirada ou recuperação" />
        <Metric label="Passaporte ativo" value={metrics.passportActive} helper="Clientes anuais ativos" />
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => chooseFunnel('')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${funnel === '' ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>Todos</button>
            <button type="button" onClick={() => chooseFunnel('first_plusum')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${funnel === 'first_plusum' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}>Meu Primeiro +UM</button>
            <button type="button" onClick={() => chooseFunnel('passport')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${funnel === 'passport' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Passaporte</button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availableStageFilters.map((filter) => (
                <button key={filter.value || 'all-stages'} type="button" onClick={() => setCommercialStage(filter.value)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium ${commercialStage === filter.value ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{filter.label}</button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome, e-mail, WhatsApp ou influencer" className="h-11 w-full rounded-xl border border-neutral-300 px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 lg:max-w-md" />
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <strong>Automações ainda não foram disparadas.</strong> Os funis e segmentos estão prontos; a sequência e a copy de e-mail/WhatsApp serão montadas com você antes de ativarmos qualquer automação.
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white py-14 text-center text-neutral-500">Carregando CRM...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white py-14 text-center text-neutral-500">Nenhum contato neste segmento.</div>
      ) : (
        <div className="grid gap-3">
          {visible.map((contact) => {
            const meta = stageMeta[contact.commercial_stage] ?? stageMeta.first_plusum_eligible
            const funnelInfo = funnelMeta[contact.commercial_funnel]
            const canWhatsApp = Boolean(contact.whatsapp_number && contact.whatsapp_opt_in && !contact.do_not_contact_whatsapp)
            return (
              <article key={contact.user_id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-neutral-950">{contact.full_name || 'Usuário sem nome'}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${funnelInfo.className}`}>{funnelInfo.label}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      {contact.influencer_name ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">Origem: {contact.influencer_name}</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{meta.helper}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-700">
                      <span>{contact.email || 'Sem e-mail'}</span>
                      <span>{contact.whatsapp_number || 'Sem WhatsApp'}</span>
                      {contact.last_use_at ? <span>Último uso: {formatDate(contact.last_use_at)}</span> : null}
                      {contact.offer_price_cents && contact.commercial_stage === 'passport_offer_active' ? <span className="font-semibold text-orange-700">Passaporte {money(contact.offer_price_cents)}</span> : null}
                      {contact.offer_expires_at && contact.commercial_stage === 'passport_offer_active' ? <span className="font-medium text-orange-700">expira {formatRelative(contact.offer_expires_at)}</span> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <ConsentBadge active={contact.email_opt_in && !contact.do_not_contact_email} label="E-mail" />
                      <ConsentBadge active={contact.whatsapp_opt_in && !contact.do_not_contact_whatsapp} label="WhatsApp" />
                      {contact.next_follow_up_at ? <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">Follow-up {formatRelative(contact.next_follow_up_at)}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
                    <select value={contact.manual_status || 'open'} onChange={(e) => void updateStatus(contact, e.target.value)} disabled={busyId === contact.user_id} className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700">
                      <option value="open">Aberto</option>
                      <option value="contacted">Contactado</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="won">Convertido</option>
                      <option value="lost">Perdido</option>
                      <option value="paused">Pausado</option>
                    </select>
                    <button type="button" onClick={() => void setFollowUpTomorrow(contact)} disabled={busyId === contact.user_id} className="h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Follow +1d</button>
                    <button type="button" onClick={() => void openWhatsApp(contact)} disabled={!canWhatsApp || busyId === contact.user_id} className="h-11 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500" title={canWhatsApp ? 'Abrir conversa no WhatsApp' : 'WhatsApp indisponível ou sem autorização'}>{canWhatsApp ? 'Abrir WhatsApp' : 'WhatsApp indisponível'}</button>
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
  return <span className={`rounded-full px-2.5 py-1 font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{label}: {active ? 'liberado' : 'bloqueado'}</span>
}

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  return digits
}

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(cents / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value))
}

function formatRelative(value: string) {
  const hours = Math.round((new Date(value).getTime() - Date.now()) / 3600000)
  if (Math.abs(hours) < 1) return 'agora'
  if (hours > 0 && hours < 24) return `em ${hours}h`
  if (hours < 0 && hours > -24) return `há ${Math.abs(hours)}h`
  const days = Math.round(hours / 24)
  return days > 0 ? `em ${days}d` : `há ${Math.abs(days)}d`
}
