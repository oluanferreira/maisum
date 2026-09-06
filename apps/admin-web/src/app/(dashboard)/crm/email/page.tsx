'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Campaign = {
  id: string
  name: string
  subject: string
  preview_text: string | null
  segment: string
  status: string
  scheduled_at: string | null
  created_at: string
  recipients: number
  sent: number
  failed: number
}

type DispatchResult = {
  ok?: boolean
  claimed?: number
  sent?: number
  failed?: number
  error?: string
}

const segments = [
  { value: 'all_opted_in', label: 'Todos com opt-in' },
  { value: 'registered', label: 'Cadastrados sem uso' },
  { value: 'coupon_ready', label: 'Cupom disponível' },
  { value: 'offer_active', label: 'Oferta R$47 ativa' },
  { value: 'offer_expired', label: 'Oferta expirada' },
  { value: 'customer', label: 'Assinantes' },
]

export default function CrmEmailPage() {
  const supabase = useMemo(() => createClient(), [])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', preview: '', segment: 'all_opted_in', content: '' })

  useEffect(() => { void loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_crm_email_campaigns', { p_limit: 50 })
    if (!error) setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)

    const { data, error } = await supabase.rpc('crm_create_email_campaign', {
      p_name: form.name,
      p_subject: form.subject,
      p_preview_text: form.preview || null,
      p_html_body: emailHtml(form.content),
      p_segment: form.segment,
      p_scheduled_at: null,
    })
    const created = data as { ok?: boolean; campaign_id?: string } | null
    if (error || !created?.ok || !created.campaign_id) {
      setFeedback('Não foi possível criar a campanha.')
      setSaving(false)
      return
    }

    const { data: queueData, error: queueError } = await supabase.rpc('crm_queue_email_campaign', {
      p_campaign_id: created.campaign_id,
    })
    const queued = queueData as { ok?: boolean; queued?: number } | null
    if (queueError || !queued?.ok) {
      setFeedback('Campanha criada, mas não foi possível montar a fila de envio.')
      setSaving(false)
      void loadCampaigns()
      return
    }

    const recipientCount = queued.queued ?? 0
    if (recipientCount === 0) {
      setFeedback('Campanha criada, mas este segmento ainda não tem usuários com opt-in de e-mail.')
      setSaving(false)
      setForm({ name: '', subject: '', preview: '', segment: 'all_opted_in', content: '' })
      void loadCampaigns()
      return
    }

    const { data: dispatchData, error: dispatchError } = await supabase.functions.invoke('dispatch-crm-emails', {
      body: { campaignId: created.campaign_id },
    })
    const dispatch = dispatchData as DispatchResult | null

    if (dispatchError || !dispatch?.ok) {
      setFeedback(
        dispatch?.error === 'resend_not_configured'
          ? `Campanha com ${recipientCount} destinatários ficou na fila. Falta conectar a chave de envio do Resend no Supabase.`
          : `Campanha com ${recipientCount} destinatários ficou na fila, mas o envio automático não respondeu.`,
      )
    } else {
      const sent = dispatch.sent ?? 0
      const failed = dispatch.failed ?? 0
      setFeedback(
        failed > 0
          ? `${sent} e-mails enviados agora; ${failed} tiveram falha e ficaram registrados para tratamento.`
          : `${sent} e-mails enviados pelo Resend.`,
      )
    }

    setForm({ name: '', subject: '', preview: '', segment: 'all_opted_in', content: '' })
    setSaving(false)
    void loadCampaigns()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/crm" className="text-sm font-medium text-orange-600 hover:underline">← Voltar ao CRM</Link>
          <h1 className="mt-2 text-3xl font-bold text-neutral-950">E-mail marketing</h1>
          <p className="mt-1 text-sm text-neutral-600">Campanhas segmentadas usando a mesma classificação do CRM.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Só entram na fila usuários com opt-in de e-mail e sem bloqueio de contato.</div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Nova campanha</h2>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <Field label="Nome interno"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Newsletter setembro" /></Field>
            <Field label="Segmento"><select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className="h-11 rounded-xl border border-neutral-300 bg-white px-3 outline-none focus:border-orange-500">{segments.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
            <Field label="Assunto"><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Novos lugares para usar seu +UM" /></Field>
            <Field label="Preheader"><input value={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Linha curta ao lado do assunto" /></Field>
            <Field label="Mensagem"><textarea required rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl border border-neutral-300 p-3 leading-6 outline-none focus:border-orange-500" placeholder={'Oi!\n\nTem novidade no +UM...'} /></Field>
            {feedback ? <p className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">{feedback}</p> : null}
            <button disabled={saving} className="h-12 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">{saving ? 'Preparando e enviando...' : 'Criar campanha e enviar'}</button>
          </form>
        </section>

        <aside className="rounded-2xl border border-neutral-200 bg-neutral-950 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-400">Estratégia</p>
          <h2 className="mt-2 text-xl font-semibold">O e-mail acompanha o momento do usuário.</h2>
          <div className="mt-5 grid gap-3 text-sm text-neutral-300">
            <Tip title="Cadastrado">Ensinar o que é o +UM e levar ao primeiro uso.</Tip>
            <Tip title="Cupom disponível">Dar ideias concretas de onde usar e reduzir fricção.</Tip>
            <Tip title="Oferta R$47 ativa">Conversão: valor percebido + urgência real das 24h.</Tip>
            <Tip title="Oferta expirada">Pesquisa, objeções e futura recuperação.</Tip>
            <Tip title="Assinante">Novos parceiros, pratos e retenção, sem insistir em venda.</Tip>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">Campanhas</h2>
        <p className="text-sm text-neutral-500">Envios e falhas ficam registrados no CRM.</p>
        {loading ? <p className="py-10 text-center text-sm text-neutral-500">Carregando campanhas...</p> : campaigns.length === 0 ? <p className="py-10 text-center text-sm text-neutral-500">Nenhuma campanha criada ainda.</p> : (
          <div className="mt-4 grid gap-3">{campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-neutral-950">{campaign.name}</p><p className="text-sm text-neutral-500">{campaign.subject}</p></div><span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{campaign.status}</span></div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500"><span>Segmento: {segments.find((s) => s.value === campaign.segment)?.label ?? campaign.segment}</span><span>{campaign.recipients} destinatários</span><span>{campaign.sent} enviados</span>{campaign.failed ? <span className="text-red-600">{campaign.failed} falharam</span> : null}</div>
            </div>
          ))}</div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium text-neutral-700">{label}{children}</label> }
function Tip({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><strong className="block text-white">{title}</strong><span>{children}</span></div> }

function emailHtml(content: string) {
  const paragraphs = content.split(/\n\s*\n/).map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#27231f">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="font-size:34px;font-weight:800;color:#e55934;margin-bottom:24px">+UM</div><div style="background:#ffffff;border-radius:20px;padding:28px">${paragraphs}<p style="margin:24px 0 0"><a href="https://app.appmaisum.com.br" style="display:inline-block;background:#e55934;color:#fff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:999px">Abrir o +UM</a></p></div><p style="font-size:12px;line-height:1.5;color:#777;margin:18px 6px 0">Você recebe novidades porque autorizou comunicações do +UM. Você pode alterar suas preferências no seu perfil.</p></div></body></html>`
}
function escapeHtml(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;') }
