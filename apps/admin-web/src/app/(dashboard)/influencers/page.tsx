'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Channel = {
  id: string
  slug: string
  display_name: string
  commission_bps: number
  is_active: boolean
  account_email?: string | null
  account_active?: boolean | null
  link?: { campaign_key?: string | null; path?: string | null; is_active?: boolean | null; max_redemptions?: number | null } | null
  checkout_code?: { code: string; cakto_coupon_id?: string | null; discount_percent?: number | null; is_active?: boolean } | null
  funnel?: {
    redemptions: number
    first_uses: number
    purchases: number
    direct_purchases?: number
    experience_purchases?: number
    unlinked_direct_sales?: number
  }
  money?: {
    gross_revenue_cents: number
    pending_commission_cents: number
    paid_commission_cents: number
    reversed_commission_cents: number
    unlinked_direct_commission_cents?: number
  }
  open_payout?: { id: string; amount_cents: number; status: string; requested_at: string } | null
}

type Sale = {
  id: string
  influencer_id: string
  display_name: string
  slug: string
  provider_payment_id: string
  buyer_email?: string | null
  coupon_code?: string | null
  source: 'sales_code' | 'acquisition_link' | string
  gross_amount_cents: number
  commission_bps: number
  commission_amount_cents: number
  payment_status: string
  account_link_status: 'linked' | 'unlinked' | string
  created_at: string
  paid_at?: string | null
}

type Payout = {
  id: string
  influencer_id: string
  display_name: string
  slug: string
  amount_cents: number
  status: string
  requested_at: string
  approved_at?: string | null
  paid_at?: string | null
  external_reference?: string | null
  holder_name?: string | null
  tax_id?: string | null
  pix_key?: string | null
  pix_key_type?: string | null
}

type FormState = {
  influencerId: string
  displayName: string
  slug: string
  commissionPercent: string
  checkoutCode: string
  discountPercent: string
  caktoCouponId: string
  campaignKey: string
  accountEmail: string
}

const emptyForm: FormState = {
  influencerId: '', displayName: '', slug: '', commissionPercent: '', checkoutCode: '',
  discountPercent: '', caktoCouponId: '', campaignKey: '', accountEmail: '',
}

export default function InfluencersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [channels, setChannels] = useState<Channel[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    const [channelResult, saleResult, payoutResult] = await Promise.all([
      supabase.rpc('admin_list_influencer_channels'),
      supabase.rpc('admin_list_influencer_sales', { p_influencer_id: null, p_limit: 100 }),
      supabase.rpc('admin_list_influencer_payout_requests'),
    ])
    if (channelResult.error || saleResult.error || payoutResult.error) {
      setError(channelResult.error?.message || saleResult.error?.message || payoutResult.error?.message || 'Não foi possível carregar os influencers.')
    } else {
      setChannels((channelResult.data ?? []) as Channel[])
      setSales((saleResult.data ?? []) as Sale[])
      setPayouts((payoutResult.data ?? []) as Payout[])
    }
    setLoading(false)
  }

  function edit(channel: Channel) {
    setForm({
      influencerId: channel.id,
      displayName: channel.display_name,
      slug: channel.slug,
      commissionPercent: String(channel.commission_bps / 100),
      checkoutCode: channel.checkout_code?.code ?? '',
      discountPercent: channel.checkout_code?.discount_percent == null ? '' : String(channel.checkout_code.discount_percent),
      caktoCouponId: channel.checkout_code?.cakto_coupon_id ?? '',
      campaignKey: channel.link?.campaign_key ?? '',
      accountEmail: channel.account_email ?? '',
    })
    setMessage(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    const commission = Number(form.commissionPercent.replace(',', '.'))
    const discount = form.discountPercent.trim() ? Number(form.discountPercent.replace(',', '.')) : null
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setError('Comissão inválida. Use um valor entre 0 e 100%.')
      setSaving(false)
      return
    }

    const { data, error: provisionError } = await supabase.rpc('create_influencer_channel', {
      p_slug: form.slug.trim().toLowerCase(),
      p_display_name: form.displayName.trim(),
      p_commission_bps: Math.round(commission * 100),
      p_checkout_code: form.checkoutCode.trim() || null,
      p_campaign_key: form.campaignKey.trim() || null,
      p_max_redemptions: null,
      p_discount_percent: discount,
      p_cakto_coupon_id: form.caktoCouponId.trim() || null,
    })

    const provision = (data ?? {}) as { ok?: boolean; influencer_id?: string; error?: string }
    if (provisionError || !provision.ok || !provision.influencer_id) {
      setError(provisionError?.message || provision.error || 'Não foi possível salvar o canal.')
      setSaving(false)
      return
    }

    if (form.accountEmail.trim()) {
      const { data: accountData, error: accountError } = await supabase.rpc('assign_influencer_account', {
        p_influencer_id: provision.influencer_id,
        p_user_email: form.accountEmail.trim(),
      })
      const account = (accountData ?? {}) as { ok?: boolean; error?: string }
      if (accountError || !account.ok) {
        setError(accountError?.message || (account.error === 'user_not_found'
          ? 'Canal salvo, mas esse e-mail ainda não possui uma conta +UM. Peça ao influencer para criar/entrar na conta e vincule depois.'
          : account.error || 'Canal salvo, mas não foi possível vincular o acesso.'))
        setSaving(false)
        await load()
        return
      }
    }

    setMessage(form.influencerId ? 'Influencer atualizado.' : 'Influencer criado e link provisionado.')
    setForm(emptyForm)
    setSaving(false)
    await load()
  }

  async function toggle(channel: Channel) {
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('admin_set_influencer_active', {
      p_influencer_id: channel.id,
      p_is_active: !channel.is_active,
    })
    const result = (data ?? {}) as { ok?: boolean; error?: string }
    if (rpcError || !result.ok) setError(rpcError?.message || result.error || 'Não foi possível alterar o canal.')
    else await load()
  }

  async function resolvePayout(requestId: string, status: 'approved' | 'paid' | 'rejected') {
    const externalReference = status === 'paid' ? window.prompt('Referência/comprovante do PIX (opcional):') : null
    if (status === 'rejected' && !window.confirm('Rejeitar este saque e devolver as comissões ao saldo disponível?')) return
    const { data, error: rpcError } = await supabase.rpc('admin_resolve_influencer_payout', {
      p_request_id: requestId,
      p_status: status,
      p_external_reference: externalReference || null,
      p_admin_note: null,
    })
    const result = (data ?? {}) as { ok?: boolean; error?: string }
    if (rpcError || !result.ok) setError(rpcError?.message || result.error || 'Não foi possível atualizar o saque.')
    else {
      setMessage(status === 'paid' ? 'Saque marcado como pago.' : status === 'approved' ? 'Saque aprovado.' : 'Saque rejeitado.')
      await load()
    }
  }

  const totals = channels.reduce((acc, channel) => {
    acc.redemptions += channel.funnel?.redemptions ?? 0
    acc.uses += channel.funnel?.first_uses ?? 0
    acc.purchases += channel.funnel?.purchases ?? 0
    acc.direct += channel.funnel?.direct_purchases ?? 0
    acc.unlinked += channel.funnel?.unlinked_direct_sales ?? 0
    acc.revenue += channel.money?.gross_revenue_cents ?? 0
    acc.pending += channel.money?.pending_commission_cents ?? 0
    return acc
  }, { redemptions: 0, uses: 0, purchases: 0, direct: 0, unlinked: 0, revenue: 0, pending: 0 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Influencers</h1>
          <p className="text-neutral-600">Aquisição, venda direta, atribuição, comissão e saques em um único fluxo.</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(null); setMessage(null) }} className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white">
          Novo influencer
        </button>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <Metric label="Resgates" value={String(totals.redemptions)} />
        <Metric label="Primeiros usos" value={String(totals.uses)} />
        <Metric label="Vendas" value={String(totals.purchases)} />
        <Metric label="Diretas" value={String(totals.direct)} />
        <Metric label="A vincular" value={String(totals.unlinked)} />
        <Metric label="Receita atribuída" value={money(totals.revenue)} />
        <Metric label="Comissão pendente" value={money(totals.pending)} />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">{form.influencerId ? 'Editar canal' : 'Provisionar influencer'}</h2>
          <p className="mt-1 text-sm text-neutral-500">O link de experiência fixa a aquisição no primeiro resgate válido. O cupom da Cakto identifica venda direta quando não existe origem anterior; a primeira origem válida sempre vence.</p>
        </div>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nome" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} required placeholder="Ex.: Léo Tavares" />
          <Field label="Slug do link" value={form.slug} onChange={(v) => setForm({ ...form, slug: slugify(v) })} required placeholder="leo-tavares" disabled={Boolean(form.influencerId)} />
          <Field label="Comissão (%)" value={form.commissionPercent} onChange={(v) => setForm({ ...form, commissionPercent: v })} required inputMode="decimal" placeholder="25" />
          <Field label="E-mail da conta +UM" value={form.accountEmail} onChange={(v) => setForm({ ...form, accountEmail: v })} type="email" placeholder="influencer@email.com" />
          <Field label="Cupom Cakto" value={form.checkoutCode} onChange={(v) => setForm({ ...form, checkoutCode: v.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} placeholder="Ex.: LEO20" />
          <Field label="Desconto Cakto (%)" value={form.discountPercent} onChange={(v) => setForm({ ...form, discountPercent: v })} inputMode="decimal" placeholder="Opcional" />
          <Field label="ID do cupom na Cakto" value={form.caktoCouponId} onChange={(v) => setForm({ ...form, caktoCouponId: v })} placeholder="Opcional" />
          <Field label="Campanha" value={form.campaignKey} onChange={(v) => setForm({ ...form, campaignKey: v })} placeholder="influencer-leo" />
          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
            <button disabled={saving} className="rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Salvando...' : form.influencerId ? 'Salvar alterações' : 'Criar canal + link'}
            </button>
            {form.influencerId ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700">Cancelar</button> : null}
            <p className="text-xs text-neutral-500">Cadastre aqui somente o cupom real criado na Cakto. Não criamos códigos fictícios.</p>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Canais</h2>
          <span className="text-sm text-neutral-500">{channels.length} cadastrados</span>
        </div>
        {loading ? <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">Carregando...</div> : channels.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">Nenhum influencer cadastrado ainda.</div>
        ) : channels.map((channel) => {
          const f = channel.funnel ?? { redemptions: 0, first_uses: 0, purchases: 0 }
          const m = channel.money ?? { gross_revenue_cents: 0, pending_commission_cents: 0, paid_commission_cents: 0, reversed_commission_cents: 0 }
          const direct = f.direct_purchases ?? 0
          const postExperience = f.experience_purchases ?? Math.max(0, f.purchases - direct)
          return (
            <div key={channel.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-900">{channel.display_name}</h3>
                    <Badge tone={channel.is_active ? 'green' : 'neutral'}>{channel.is_active ? 'Ativo' : 'Pausado'}</Badge>
                    <Badge tone="orange">{formatPercent(channel.commission_bps / 100)} comissão</Badge>
                    {(f.unlinked_direct_sales ?? 0) > 0 ? <Badge tone="orange">{f.unlinked_direct_sales} venda(s) a vincular</Badge> : null}
                  </div>
                  <p className="mt-2 break-all text-sm text-neutral-500">app.appmaisum.com.br{channel.link?.path ?? `/ativar/UM-${channel.slug.toUpperCase()}`}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                    <span>Cupom direto: <strong className="text-neutral-700">{channel.checkout_code?.code ?? 'não configurado'}</strong></span>
                    <span>Acesso: <strong className="text-neutral-700">{channel.account_email ?? 'não vinculado'}</strong></span>
                    <span>Campanha: <strong className="text-neutral-700">{channel.link?.campaign_key ?? '—'}</strong></span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => edit(channel)} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700">Editar</button>
                  <button onClick={() => void toggle(channel)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${channel.is_active ? 'border border-red-200 text-red-700' : 'bg-neutral-900 text-white'}`}>
                    {channel.is_active ? 'Pausar canal' : 'Reativar canal'}
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-4 xl:grid-cols-8">
                <Mini label="Resgates" value={String(f.redemptions)} />
                <Mini label="Usos" value={String(f.first_uses)} />
                <Mini label="Diretas" value={String(direct)} />
                <Mini label="Pós-experiência" value={String(postExperience)} />
                <Mini label="Vendas" value={String(f.purchases)} />
                <Mini label="Uso / resgate" value={rate(f.first_uses, f.redemptions)} />
                <Mini label="Receita" value={money(m.gross_revenue_cents)} />
                <Mini label="Comissão pendente" value={money(m.pending_commission_cents)} />
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Vendas atribuídas</h2>
            <p className="text-sm text-neutral-500">Cakto + link de primeira experiência no mesmo livro financeiro. Vendas diretas são detectadas pelo cupom mesmo antes de a compra ser vinculada a uma conta +UM.</p>
          </div>
          <span className="text-sm text-neutral-500">Últimas {sales.length} vendas</span>
        </div>
        {loading ? <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">Carregando vendas...</div> : sales.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">Nenhuma venda atribuída a influencer ainda.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Influencer</th>
                    <th className="px-4 py-3 font-semibold">Origem</th>
                    <th className="px-4 py-3 font-semibold">Cupom</th>
                    <th className="px-4 py-3 font-semibold">Comprador</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Comissão</th>
                    <th className="px-4 py-3 font-semibold">Vínculo</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="text-neutral-700">
                      <td className="px-4 py-3 font-semibold text-neutral-900">{sale.display_name}</td>
                      <td className="px-4 py-3"><Badge tone={sale.source === 'sales_code' ? 'orange' : 'green'}>{sale.source === 'sales_code' ? 'Venda direta' : 'Pós-experiência'}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs">{sale.coupon_code ?? '—'}</td>
                      <td className="px-4 py-3">{sale.buyer_email ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-900">{money(sale.gross_amount_cents)}</td>
                      <td className="px-4 py-3">{money(sale.commission_amount_cents)} <span className="text-xs text-neutral-400">({formatPercent(sale.commission_bps / 100)})</span></td>
                      <td className="px-4 py-3"><Badge tone={sale.account_link_status === 'linked' ? 'green' : 'orange'}>{sale.account_link_status === 'linked' ? 'Conta vinculada' : 'A vincular'}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={sale.payment_status === 'paid' ? 'green' : sale.payment_status === 'refunded' || sale.payment_status === 'chargeback' || sale.payment_status === 'reversed' ? 'red' : 'neutral'}>{salePaymentStatus(sale.payment_status)}</Badge></td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{new Date(sale.paid_at ?? sale.created_at).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Saques</h2>
          <p className="text-sm text-neutral-500">Aprovação continua manual no MVP. Comissão de venda direta detectada mas ainda não vinculada à conta entra no controle financeiro, porém só fica sacável após o vínculo formal.</p>
        </div>
        {payouts.length === 0 ? <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">Nenhuma solicitação de saque.</div> : payouts.map((payout) => (
          <div key={payout.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-neutral-900">{payout.display_name}</strong>
                  <Badge tone={payout.status === 'paid' ? 'green' : payout.status === 'rejected' ? 'red' : 'orange'}>{payoutStatus(payout.status)}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-neutral-900">{money(payout.amount_cents)}</p>
                <p className="mt-1 text-xs text-neutral-500">Solicitado em {new Date(payout.requested_at).toLocaleString('pt-BR')}</p>
                {payout.pix_key ? <p className="mt-2 text-sm text-neutral-600">PIX {payout.pix_key_type?.toUpperCase()} · {payout.pix_key} · {payout.holder_name}</p> : <p className="mt-2 text-sm text-red-600">Dados PIX não disponíveis.</p>}
              </div>
              {payout.status === 'requested' || payout.status === 'approved' ? (
                <div className="flex flex-wrap gap-2">
                  {payout.status === 'requested' ? <button onClick={() => void resolvePayout(payout.id, 'approved')} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">Aprovar</button> : null}
                  <button onClick={() => void resolvePayout(payout.id, 'paid')} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">Marcar pago</button>
                  <button onClick={() => void resolvePayout(payout.id, 'rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Rejeitar</button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder, inputMode, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; inputMode?: 'text' | 'decimal' | 'numeric' | 'email'; disabled?: boolean
}) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium text-neutral-700">{label}</span><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} disabled={disabled} className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#FF6B35] disabled:bg-neutral-100" /></label>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-neutral-200 bg-white p-4"><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-2 text-xl font-bold text-neutral-900">{value}</p></div> }
function Mini({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p><p className="mt-1 text-sm font-semibold text-neutral-800">{value}</p></div> }
function Badge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'orange' | 'red' | 'neutral' }) { const cls = { green: 'bg-green-50 text-green-700', orange: 'bg-orange-50 text-orange-700', red: 'bg-red-50 text-red-700', neutral: 'bg-neutral-100 text-neutral-600' }[tone]; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span> }
function money(cents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100) }
function rate(value: number, base: number) { return base > 0 ? `${((value / base) * 100).toFixed(1).replace('.', ',')}%` : '0%' }
function formatPercent(value: number) { return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` }
function payoutStatus(value: string) { return ({ requested: 'Solicitado', approved: 'Aprovado', paid: 'Pago', rejected: 'Rejeitado', cancelled: 'Cancelado' } as Record<string, string>)[value] ?? value }
function salePaymentStatus(value: string) { return ({ paid: 'Pago', refunded: 'Reembolsado', chargeback: 'Chargeback', reversed: 'Estornado' } as Record<string, string>)[value] ?? value }
function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) }