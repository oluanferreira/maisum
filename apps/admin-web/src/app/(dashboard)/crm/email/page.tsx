'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

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
  const [form, setForm] = useState({
    name: '',
    subject: '',
    preview: '',
    segment: 'all_opted_in',
    content: '',
  })

  useEffect(() => {
    void loadCampaigns()
  }, [])

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

    const html = emailHtml(form.content)
    const { data, error } = await supabase.rpc('crm_create_email_campaign', {
      p_name: form.name,
      p_subject: form.subject,
      p_preview_text: form.preview || null,
      p_html_body: html,
      p_segment: form.segment,
      p_scheduled_at: null,
    })

    const created = data as { ok?: boolean; campaign_id?: string; error?: string } | null
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
    } else {
      setFeedback(`Campanha pronta: ${queued.queued ?? 0} destinatários com opt-in.`)
      setForm({ name: '', subject: '', preview: '', segment: 'all_opted_in', content: '' })
    }

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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Só entram na fila usuários com opt-in de e-mail e sem bloqueio de contato.
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Nova campanha</h2>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Nome interno
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Newsletter setembro" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Segmento
              <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className="h-11 rounded-xl border border-neutral-300 bg-white px-3 outline-none focus:border-orange-500">
                {segments.map((segment) => <option key={segment.value} value={segment.value}>{segment.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Assunto
              <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Novos lugares para usar seu +UM" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Preheader
              <input value={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.value })} className="h-11 rounded-xl border border-neutral-300 px-3 outline-none focus:border-orange-500" placeholder="Uma linha curta que aparece ao lado do assunto" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
              Mensagem
              <textarea required rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl border border-neutral-300 p-3 leading-6 outline-none focus:border-orange-500" placeholder={'Oi!\n\nTem novidade no +UM...\n\nVeja os novos parceiros e escolha sua próxima experiência.'} />
            </label>
            {feedback ? <p className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">{feedback}</p> : null}
            <button disabled={saving} className="h-12 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
              {saving ? 'Preparando campanha...' : 'Criar e abastecer fila'}
            </button>
          </form>
        </section>

        <aside className="rounded-2xl border border-neutral-200 bg-neutral-950 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-400">Estratégia</p>
          <h2 className="mt-2 text-xl font-semibold">O e-mail acompanha o momento do usuário.</h2>
          <div className="mt-5 grid gap-3 text-sm text-neutral-300">
            <Tip title="Cadastrado">Ensinar o que é o +UM e levar ao primeiro uso.</Tip>
            <Tip title="Cupom disponível">Dar ideias concretas de onde usar e reduzir fricção.</Tip>
            <Tip title="Oferta R$47 ativa">Conversão. Benefício percebido + urgência real das 24h.</Tip>
            <Tip title="Oferta expirada">Pesquisa, objeções e futura recuperação.</Tip>
            <Tip title="Assinante">Novos parceiros, pratos e retenção. Sem insistir em venda.</Tip>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">Campanhas</h2>
            <p className="text-sm text-neutral-500">Fila preparada para o dispatcher do Resend.</p>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-neutral-500">Carregando campanhas...</p>
        ) : campaigns.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">Nenhuma campanha criada ainda.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-neutral-950">{campaign.name}</p>
                    <p className="text-sm text-neutral-500">{campaign.subject}</p>
                  </div>
                  <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">{campaign.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
                  <span>Segmento: {segments.find((s) => s.value === campaign.segment)?.label ?? campaign.segment}</span>
                  <span>{campaign.recipients} destinatários</span>
                  <span>{campaign.sent} enviados</span>
                  {campaign.failed ? <span className="text-red-600">{campaign.failed} falharam</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><strong className="block text-white">{title}</strong><span>{children}</span></div>
}

function emailHtml(content: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((part) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#27231f">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="font-size:34px;font-weight:800;color:#e55934;margin-bottom:24px">+UM</div><div style="background:#ffffff;border-radius:20px;padding:28px">${paragraphs}<p style="margin:24px 0 0"><a href="https://app.appmaisum.com.br" style="display:inline-block;background:#e55934;color:#fff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:999px">Abrir o +UM</a></p></div><p style="font-size:12px;line-height:1.5;color:#777;margin:18px 6px 0">Você recebe novidades porque autorizou comunicações do +UM. Você pode alterar suas preferências no seu perfil.</p></div></body></html>`
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
