'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Campaign = {
  id: string
  subject: string
  status: string
  approval_status: 'pending_approval' | 'approved' | 'rejected' | 'legacy_sent'
  theme_key: string | null
  send_window_label: string | null
  body_text: string | null
  hero_image_url: string | null
  sent: number
  clicks: number
  first_uses: number
  open_rate: number
  click_rate: number
  first_use_rate: number
}

export default function DesireEmailPage() {
  const supabase = useMemo(() => createClient(), [])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    const { data: funnelData, error } = await supabase.rpc('get_crm_marketing_funnels_dashboard')
    if (error) {
      setFeedback('Não foi possível carregar o funil.')
      setLoading(false)
      return
    }
    const funnels = (funnelData ?? []) as Array<{ funnel_key: string; steps: Array<{ id: string; step_key: string }> }>
    const step = funnels.find((f) => f.funnel_key === 'meu_primeiro_plusum')?.steps.find((s) => s.step_key === 'activated_not_used')
    if (!step) {
      setFeedback('Etapa de desejo não encontrada.')
      setLoading(false)
      return
    }
    const { data, error: campaignError } = await supabase.rpc('get_crm_funnel_step_campaigns', { p_step_id: step.id })
    if (campaignError) setFeedback('Não foi possível carregar os rascunhos.')
    else setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }

  async function changeApproval(campaign: Campaign, action: 'approve' | 'revoke') {
    const text = action === 'approve'
      ? `Aprovar “${campaign.subject}”? Isso não envia o e-mail.`
      : `Revogar a aprovação de “${campaign.subject}”?`
    if (!window.confirm(text)) return
    setBusy(campaign.id)
    const { data, error } = await supabase.rpc('admin_set_crm_email_campaign_approval', {
      p_campaign_id: campaign.id,
      p_action: action,
      p_note: action === 'approve' ? 'Aprovado manualmente no Admin.' : null,
    })
    const result = data as { ok?: boolean; error?: string } | null
    if (error || !result?.ok) setFeedback(`Não foi possível alterar a aprovação${result?.error ? `: ${result.error}` : '.'}`)
    else {
      setFeedback(action === 'approve' ? 'Conteúdo aprovado. Nenhum envio foi feito.' : 'Aprovação revogada.')
      await load()
    }
    setBusy(null)
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <header>
        <Link href="/crm/email" className="text-xs font-semibold text-[#ff8f72]">← Funis de e-mail</Link>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff8f72]">Meu Primeiro +UM</p>
        <h1 className="font-display mt-1 text-4xl leading-none text-[#f5edde] sm:text-5xl">Desejo contextual</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8e8268]">E-mails por momento de consumo, com abertura, clique e primeiro uso atribuído ao último toque.</p>
      </header>

      <div className="rounded-2xl border border-[#f5d272]/20 bg-[#f5d272]/8 p-4 text-sm leading-6 text-[#d9c386]">
        <strong>Trava manual ativa.</strong> Aprovar conteúdo não envia. O envio só pode acontecer depois de uma confirmação e de um agendamento separado.
      </div>

      {feedback ? <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#b8ab94]">{feedback}</div> : null}

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-[1.75rem] border border-white/8 bg-white/[0.025]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a59]" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-[#1e1810]">
              {campaign.hero_image_url ? <img src={campaign.hero_image_url} alt="" className="h-40 w-full object-cover" /> : null}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff8f72]">{campaign.send_window_label || campaign.theme_key}</p>
                    <h2 className="mt-1.5 text-lg font-semibold leading-6 text-[#f5edde]">{campaign.subject}</h2>
                  </div>
                  <Approval status={campaign.approval_status} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Kpi label="Abertura" value={percent(campaign.open_rate)} />
                  <Kpi label="Clique" value={percent(campaign.click_rate)} />
                  <Kpi label="1º uso" value={percent(campaign.first_use_rate)} hot />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-[#8e8268]">
                  <div><strong className="block text-base text-[#f5edde]">{campaign.sent}</strong> enviados</div>
                  <div><strong className="block text-base text-[#f5edde]">{campaign.clicks}</strong> cliques</div>
                  <div><strong className="block text-base text-[#ff9a80]">{campaign.first_uses}</strong> usos</div>
                </div>

                <p className="mt-4 line-clamp-6 whitespace-pre-line text-xs leading-5 text-[#8e8268]">{campaign.body_text}</p>
                <div className="mt-4 border-t border-white/8 pt-3">
                  {campaign.approval_status === 'approved' ? (
                    <button onClick={() => void changeApproval(campaign, 'revoke')} disabled={busy === campaign.id} className="h-11 w-full rounded-xl border border-[#f5d272]/20 bg-[#f5d272]/8 px-3 text-xs font-bold text-[#f5d272] disabled:opacity-40">Revogar aprovação</button>
                  ) : (
                    <button onClick={() => void changeApproval(campaign, 'approve')} disabled={campaign.status !== 'draft' || busy === campaign.id} className="h-11 w-full rounded-xl bg-[#ff7a59] px-3 text-xs font-bold text-[#141008] disabled:opacity-40">Aprovar conteúdo</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return <div className={`rounded-xl p-2 text-center ${hot ? 'bg-[#ff7a59]/10' : 'bg-white/[0.025]'}`}><p className="text-[9px] text-[#8e8268]">{label}</p><p className={`mt-0.5 text-sm font-bold ${hot ? 'text-[#ff9a80]' : 'text-[#f5edde]'}`}>{value}</p></div>
}

function Approval({ status }: { status: Campaign['approval_status'] }) {
  const classes: Record<string,string> = { approved:'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',pending_approval:'border-[#f5d272]/20 bg-[#f5d272]/8 text-[#f5d272]',rejected:'border-red-400/20 bg-red-400/10 text-red-300',legacy_sent:'border-white/8 bg-white/[0.03] text-[#8e8268]' }
  const labels: Record<string,string> = { approved:'Aprovado',pending_approval:'Aguardando',rejected:'Rejeitado',legacy_sent:'Histórico' }
  return <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${classes[status]}`}>{labels[status]}</span>
}

function percent(value: number) { return `${Number(value ?? 0).toFixed(1).replace('.', ',')}%` }
