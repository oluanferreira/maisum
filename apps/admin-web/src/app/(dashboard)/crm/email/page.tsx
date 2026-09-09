'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Variant = {
  id: string
  variant_key: string
  subject: string
  preheader: string | null
  headline: string | null
  body_text: string
  cta_label: string
  cta_path: string
  weight: number
  is_active: boolean
}

type Step = {
  id: string
  step_key: string
  position: number
  name: string
  description: string | null
  trigger_stage: string | null
  channel: 'email' | 'whatsapp' | 'system'
  status: 'draft' | 'active' | 'paused' | 'archived'
  delay_minutes: number
  experiment_key: string | null
  metrics: Record<string, number>
  variants: Variant[]
}

type Funnel = {
  id: string
  funnel_key: string
  category: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  metrics: Record<string, number>
  steps: Step[]
}

type ExperimentMetric = {
  variant_key: string
  subject: string
  preview_text: string | null
  status: string
  assigned: number
  queued: number
  sent: number
  failed: number
  opens: number
  clicks: number
  activations: number
  first_uses: number
}

type VariantDraft = {
  subject: string
  preheader: string
  headline: string
  body_text: string
  cta_label: string
  cta_path: string
  is_active: boolean
}

export default function CrmEmailPage() {
  const supabase = useMemo(() => createClient(), [])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [experimentMetrics, setExperimentMetrics] = useState<Record<string, ExperimentMetric[]>>({})
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantDraft, setVariantDraft] = useState<VariantDraft | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setFeedback(null)
    const { data, error } = await supabase.rpc('get_crm_marketing_funnels_dashboard')
    if (error) {
      console.error(error)
      setFeedback('Não foi possível carregar os funis agora.')
      setLoading(false)
      return
    }
    const rows = (data ?? []) as Funnel[]
    setFunnels(rows)
    if (!activeCategory && rows[0]?.category) setActiveCategory(rows[0].category)

    const keys = Array.from(new Set(rows.flatMap((f) => f.steps.map((s) => s.experiment_key).filter(Boolean)))) as string[]
    const metricsEntries = await Promise.all(keys.map(async (key) => {
      const { data: metricData } = await supabase.rpc('get_crm_email_experiment_metrics', { p_experiment_key: key })
      return [key, (metricData ?? []) as ExperimentMetric[]] as const
    }))
    setExperimentMetrics(Object.fromEntries(metricsEntries))
    setLoading(false)
  }

  const categories = useMemo(() => Array.from(new Set(funnels.map((f) => f.category))), [funnels])
  const visibleFunnels = useMemo(() => funnels.filter((f) => !activeCategory || f.category === activeCategory), [funnels, activeCategory])

  function beginVariantEdit(variant: Variant) {
    setEditingVariantId(variant.id)
    setVariantDraft({
      subject: variant.subject,
      preheader: variant.preheader ?? '',
      headline: variant.headline ?? '',
      body_text: variant.body_text,
      cta_label: variant.cta_label,
      cta_path: variant.cta_path,
      is_active: variant.is_active,
    })
    setFeedback(null)
  }

  async function saveVariant(variantId: string) {
    if (!variantDraft) return
    setBusyId(variantId)
    const { data, error } = await supabase.rpc('admin_update_crm_marketing_email_variant', {
      p_variant_id: variantId,
      p_subject: variantDraft.subject,
      p_preheader: variantDraft.preheader || null,
      p_headline: variantDraft.headline || null,
      p_body_text: variantDraft.body_text,
      p_cta_label: variantDraft.cta_label,
      p_cta_path: variantDraft.cta_path,
      p_is_active: variantDraft.is_active,
    })
    const result = data as { ok?: boolean } | null
    if (error || !result?.ok) setFeedback('Não foi possível salvar esta variante.')
    else {
      setFeedback('Variante salva. O rascunho da campanha foi sincronizado.')
      setEditingVariantId(null)
      setVariantDraft(null)
      await load()
    }
    setBusyId(null)
  }

  async function saveStep(step: Step, nextStatus: Step['status'], delayMinutes: number) {
    setBusyId(step.id)
    const { data, error } = await supabase.rpc('admin_update_crm_marketing_step', {
      p_step_id: step.id,
      p_name: step.name,
      p_description: step.description,
      p_status: nextStatus,
      p_delay_minutes: delayMinutes,
    })
    const result = data as { ok?: boolean } | null
    if (error || !result?.ok) setFeedback('Não foi possível atualizar a etapa.')
    else {
      setFeedback('Etapa atualizada.')
      await load()
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link href="/crm" className="text-sm font-medium text-orange-600 hover:underline">← Voltar ao CRM</Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">CRM · E-mail marketing</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">Funis de relacionamento</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">Organize cada jornada por categoria, acompanhe abertura, clique e ativação e edite cada etapa sem sair do Admin.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Automações pausadas.</strong> Nenhum disparo acontece até ativarmos as etapas aprovadas.
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${activeCategory === category ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{category}</button>
          ))}
        </div>
      </section>

      {feedback ? <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">{feedback}</div> : null}

      {loading ? <div className="rounded-2xl border border-neutral-200 bg-white py-16 text-center text-neutral-500">Carregando funis...</div> : visibleFunnels.map((funnel) => (
        <section key={funnel.id} className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-950 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-300">{funnel.category}</span>
                  <StatusBadge status={funnel.status} dark />
                </div>
                <h2 className="mt-3 text-2xl font-bold">{funnel.name}</h2>
                <p className="mt-1 max-w-2xl text-sm text-neutral-300">{funnel.description}</p>
              </div>
              <div className="text-xs text-neutral-400">Primeiro funil do +UM · aquisição e ativação</div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric label="Elegíveis" value={funnel.metrics.eligible ?? 0} />
              <Metric label="Enviados" value={funnel.metrics.email_sent ?? 0} />
              <Metric label="Aberturas" value={funnel.metrics.opened ?? 0} helper={rate(funnel.metrics.opened, funnel.metrics.email_sent)} />
              <Metric label="Cliques CTA" value={funnel.metrics.clicked ?? 0} helper={rate(funnel.metrics.clicked, funnel.metrics.email_sent)} />
              <Metric label="Ativações" value={funnel.metrics.activated ?? 0} helper={rate(funnel.metrics.activated, funnel.metrics.email_sent)} emphasis />
              <Metric label="Primeiro uso" value={funnel.metrics.first_use ?? 0} helper={rate(funnel.metrics.first_use, funnel.metrics.activated)} />
            </div>

            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Etapas do funil</p>
              <div className="mt-3 grid gap-4">
                {funnel.steps.map((step) => (
                  <StepCard key={step.id} step={step} metrics={step.experiment_key ? experimentMetrics[step.experiment_key] ?? [] : []} busy={busyId === step.id} editingVariantId={editingVariantId} variantDraft={variantDraft} onBeginVariantEdit={beginVariantEdit} onVariantDraftChange={setVariantDraft} onCancelVariantEdit={() => { setEditingVariantId(null); setVariantDraft(null) }} onSaveVariant={saveVariant} onSaveStep={saveStep} busyId={busyId} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

function StepCard({ step, metrics, busy, editingVariantId, variantDraft, onBeginVariantEdit, onVariantDraftChange, onCancelVariantEdit, onSaveVariant, onSaveStep, busyId }: {
  step: Step
  metrics: ExperimentMetric[]
  busy: boolean
  editingVariantId: string | null
  variantDraft: VariantDraft | null
  onBeginVariantEdit: (variant: Variant) => void
  onVariantDraftChange: (draft: VariantDraft) => void
  onCancelVariantEdit: () => void
  onSaveVariant: (id: string) => Promise<void>
  onSaveStep: (step: Step, status: Step['status'], delay: number) => Promise<void>
  busyId: string | null
}) {
  const [status, setStatus] = useState<Step['status']>(step.status)
  const [delay, setDelay] = useState(step.delay_minutes)

  useEffect(() => { setStatus(step.status); setDelay(step.delay_minutes) }, [step.status, step.delay_minutes])

  return (
    <article className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-950 text-xs font-bold text-white">{step.position}</span>
            <h3 className="text-lg font-semibold text-neutral-950">{step.name}</h3>
            <StatusBadge status={step.status} />
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">{channelLabel(step.channel)}</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">{step.description}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-neutral-500">Status<select value={status} onChange={(e) => setStatus(e.target.value as Step['status'])} className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700"><option value="draft">Rascunho</option><option value="active">Ativa</option><option value="paused">Pausada</option><option value="archived">Arquivada</option></select></label>
          <label className="grid gap-1 text-xs font-medium text-neutral-500">Atraso (min)<input type="number" min={0} value={delay} onChange={(e) => setDelay(Math.max(0, Number(e.target.value) || 0))} className="h-10 w-28 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700" /></label>
          <button type="button" onClick={() => void onSaveStep(step, status, delay)} disabled={busy} className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50">Salvar etapa</button>
        </div>
      </div>

      {step.step_key === 'invite_initial' ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MiniMetric label="Amostra" value={step.metrics.assigned ?? 0} />
          <MiniMetric label="Enviados" value={step.metrics.sent ?? 0} />
          <MiniMetric label="Aberturas" value={step.metrics.opened ?? 0} helper={rate(step.metrics.opened, step.metrics.sent)} />
          <MiniMetric label="Cliques CTA" value={step.metrics.clicked ?? 0} helper={rate(step.metrics.clicked, step.metrics.sent)} />
          <MiniMetric label="Ativações" value={step.metrics.activated ?? 0} helper={rate(step.metrics.activated, step.metrics.sent)} emphasis />
        </div>
      ) : step.metrics.contacts !== undefined ? (
        <div className="mt-5"><MiniMetric label="Contatos nesta etapa" value={step.metrics.contacts} /></div>
      ) : null}

      {step.variants.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {step.variants.map((variant) => {
            const metric = metrics.find((m) => m.variant_key === variant.variant_key)
            const editing = editingVariantId === variant.id && variantDraft
            return (
              <div key={variant.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">Variante {variant.variant_key}</p><h4 className="mt-1 text-base font-semibold text-neutral-950">{variant.subject}</h4></div>
                  <button type="button" onClick={() => onBeginVariantEdit(variant)} className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Editar</button>
                </div>

                {metric ? <div className="mt-4 grid grid-cols-3 gap-2"><Tiny label="Abertura" value={rate(metric.opens, metric.sent)} /><Tiny label="Clique" value={rate(metric.clicks, metric.sent)} /><Tiny label="Ativação" value={rate(metric.activations, metric.sent)} strong /></div> : null}

                {!editing ? <div className="mt-4 space-y-2 text-sm text-neutral-600"><p><strong className="text-neutral-900">Preheader:</strong> {variant.preheader || '—'}</p><p><strong className="text-neutral-900">Headline:</strong> {variant.headline || '—'}</p><p className="whitespace-pre-line line-clamp-6">{variant.body_text}</p><p><strong className="text-neutral-900">CTA:</strong> {variant.cta_label}</p></div> : (
                  <div className="mt-4 grid gap-3">
                    <Input label="Assunto" value={variantDraft.subject} onChange={(value) => onVariantDraftChange({ ...variantDraft, subject: value })} />
                    <Input label="Preheader" value={variantDraft.preheader} onChange={(value) => onVariantDraftChange({ ...variantDraft, preheader: value })} />
                    <Input label="Headline" value={variantDraft.headline} onChange={(value) => onVariantDraftChange({ ...variantDraft, headline: value })} />
                    <label className="grid gap-1 text-xs font-medium text-neutral-600">Corpo<textarea rows={12} value={variantDraft.body_text} onChange={(e) => onVariantDraftChange({ ...variantDraft, body_text: e.target.value })} className="rounded-xl border border-neutral-300 p-3 text-sm leading-6 outline-none focus:border-orange-500" /></label>
                    <Input label="CTA" value={variantDraft.cta_label} onChange={(value) => onVariantDraftChange({ ...variantDraft, cta_label: value })} />
                    <Input label="Destino" value={variantDraft.cta_path} onChange={(value) => onVariantDraftChange({ ...variantDraft, cta_path: value })} />
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={variantDraft.is_active} onChange={(e) => onVariantDraftChange({ ...variantDraft, is_active: e.target.checked })} /> Variante ativa no teste</label>
                    <div className="flex gap-2"><button type="button" onClick={() => void onSaveVariant(variant.id)} disabled={busyId === variant.id} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Salvar variante</button><button type="button" onClick={onCancelVariantEdit} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700">Cancelar</button></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">Copy ainda não definida para esta etapa. Ela permanece pausada até ser construída e aprovada.</div>}
    </article>
  )
}

function Metric({ label, value, helper, emphasis = false }: { label: string; value: number; helper?: string; emphasis?: boolean }) { return <div className={`rounded-2xl border p-4 ${emphasis ? 'border-orange-200 bg-orange-50' : 'border-neutral-200 bg-white'}`}><p className="text-xs font-medium text-neutral-500">{label}</p><p className={`mt-1 text-3xl font-bold ${emphasis ? 'text-orange-700' : 'text-neutral-950'}`}>{value}</p>{helper ? <p className="mt-1 text-xs text-neutral-400">{helper}</p> : null}</div> }
function MiniMetric({ label, value, helper, emphasis = false }: { label: string; value: number; helper?: string; emphasis?: boolean }) { return <div className={`rounded-xl border px-3 py-2.5 ${emphasis ? 'border-orange-200 bg-orange-50' : 'border-neutral-200 bg-white'}`}><p className="text-[11px] font-medium text-neutral-500">{label}</p><p className={`mt-0.5 text-xl font-bold ${emphasis ? 'text-orange-700' : 'text-neutral-950'}`}>{value}</p>{helper ? <p className="text-[11px] text-neutral-400">{helper}</p> : null}</div> }
function Tiny({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className={`rounded-xl px-2 py-2 text-center ${strong ? 'bg-orange-50' : 'bg-neutral-50'}`}><p className="text-[10px] text-neutral-500">{label}</p><p className={`mt-0.5 text-sm font-bold ${strong ? 'text-orange-700' : 'text-neutral-900'}`}>{value}</p></div> }
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-xs font-medium text-neutral-600">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-orange-500" /></label> }
function StatusBadge({ status, dark = false }: { status: string; dark?: boolean }) { const map: Record<string, string> = { active: dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700', paused: dark ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-50 text-amber-700', draft: dark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-600', archived: dark ? 'bg-white/10 text-neutral-400' : 'bg-neutral-100 text-neutral-500' }; const label: Record<string, string> = { active: 'Ativa', paused: 'Pausada', draft: 'Rascunho', archived: 'Arquivada' }; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? map.draft}`}>{label[status] ?? status}</span> }
function rate(num?: number, den?: number) { if (!den) return '0%'; return `${((Number(num ?? 0) / den) * 100).toFixed(1).replace('.', ',')}%` }
function channelLabel(channel: Step['channel']) { return channel === 'email' ? 'E-mail' : channel === 'whatsapp' ? 'WhatsApp' : 'Sistema' }
