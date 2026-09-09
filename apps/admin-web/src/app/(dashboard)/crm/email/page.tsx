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

type StepDraft = {
  name: string
  description: string
  status: Step['status']
  delay: number
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
  const editingVariant = useMemo(() => funnels.flatMap((f) => f.steps.flatMap((s) => s.variants)).find((v) => v.id === editingVariantId) ?? null, [funnels, editingVariantId])

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

  function closeVariantEdit() {
    setEditingVariantId(null)
    setVariantDraft(null)
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
      setFeedback('Variante salva e sincronizada com a campanha.')
      closeVariantEdit()
      await load()
    }
    setBusyId(null)
  }

  async function saveStep(step: Step, draft: StepDraft) {
    setBusyId(step.id)
    const { data, error } = await supabase.rpc('admin_update_crm_marketing_step', {
      p_step_id: step.id,
      p_name: draft.name,
      p_description: draft.description || null,
      p_status: draft.status,
      p_delay_minutes: draft.delay,
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
    <div className="space-y-5 sm:space-y-7">
      <header>
        <Link href="/crm" className="text-xs font-semibold text-[#ff8f72]">← CRM de usuários</Link>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff8f72]">Relacionamento</p>
        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl leading-none text-[#f5edde] sm:text-5xl">Funis de e-mail</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8e8268]">Acompanhe a jornada, compare os testes e ajuste cada etapa pelo próprio Admin.</p>
          </div>
          <div className="w-fit rounded-full border border-[#f5d272]/20 bg-[#f5d272]/10 px-3 py-1.5 text-xs font-semibold text-[#f5d272]">Automações pausadas</div>
        </div>
      </header>

      {categories.length > 0 ? (
        <div className="admin-scroll -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === category ? 'border-[#ff7a59] bg-[#ff7a59] text-[#141008]' : 'border-white/8 bg-white/[0.03] text-[#b8ab94]'}`}>
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {feedback ? <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#b8ab94]">{feedback}</div> : null}

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-[1.75rem] border border-white/8 bg-white/[0.025]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a59]" />
        </div>
      ) : visibleFunnels.map((funnel) => (
        <section key={funnel.id} className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#1e1810] shadow-2xl shadow-black/10">
          <div className="relative overflow-hidden border-b border-white/8 px-4 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#ff7a59]/8 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#ff7a59]/20 bg-[#ff7a59]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff9a80]">{funnel.category}</span>
                <StatusBadge status={funnel.status} />
              </div>
              <h2 className="font-display mt-3 text-3xl leading-none text-[#f5edde] sm:text-4xl">{funnel.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8e8268]">{funnel.description}</p>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="admin-scroll -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:px-0 xl:grid-cols-6">
              <Metric label="Elegíveis" value={funnel.metrics.eligible ?? 0} />
              <Metric label="Enviados" value={funnel.metrics.email_sent ?? 0} />
              <Metric label="Aberturas" value={funnel.metrics.opened ?? 0} helper={rate(funnel.metrics.opened, funnel.metrics.email_sent)} />
              <Metric label="Cliques CTA" value={funnel.metrics.clicked ?? 0} helper={rate(funnel.metrics.clicked, funnel.metrics.email_sent)} />
              <Metric label="Ativações" value={funnel.metrics.activated ?? 0} helper={rate(funnel.metrics.activated, funnel.metrics.email_sent)} emphasis />
              <Metric label="Primeiro uso" value={funnel.metrics.first_use ?? 0} helper={rate(funnel.metrics.first_use, funnel.metrics.activated)} />
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8e8268]">Etapas do funil</p>
                <span className="text-[11px] text-[#6f654f]">{funnel.steps.length} etapas</span>
              </div>
              <div className="mt-3 grid gap-3">
                {funnel.steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    metrics={step.experiment_key ? experimentMetrics[step.experiment_key] ?? [] : []}
                    busy={busyId === step.id}
                    onEditVariant={beginVariantEdit}
                    onSaveStep={saveStep}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {editingVariant && variantDraft ? (
        <VariantEditor
          variant={editingVariant}
          draft={variantDraft}
          busy={busyId === editingVariant.id}
          onChange={setVariantDraft}
          onClose={closeVariantEdit}
          onSave={() => void saveVariant(editingVariant.id)}
        />
      ) : null}
    </div>
  )
}

function StepCard({ step, metrics, busy, onEditVariant, onSaveStep }: {
  step: Step
  metrics: ExperimentMetric[]
  busy: boolean
  onEditVariant: (variant: Variant) => void
  onSaveStep: (step: Step, draft: StepDraft) => Promise<void>
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState<StepDraft>({ name: step.name, description: step.description ?? '', status: step.status, delay: step.delay_minutes })

  useEffect(() => {
    setDraft({ name: step.name, description: step.description ?? '', status: step.status, delay: step.delay_minutes })
  }, [step.name, step.description, step.status, step.delay_minutes])

  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-white/8 bg-white/[0.025]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ff7a59]/12 text-xs font-bold text-[#ff8f72]">{step.position}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[#f5edde]">{step.name}</h3>
              <StatusBadge status={step.status} />
              <span className="rounded-full border border-white/8 bg-white/[0.025] px-2 py-1 text-[10px] font-semibold text-[#8e8268]">{channelLabel(step.channel)}</span>
            </div>
            <p className="mt-1.5 text-sm leading-5 text-[#8e8268]">{step.description}</p>
          </div>
          <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="shrink-0 rounded-xl border border-white/8 bg-white/[0.025] px-2.5 py-2 text-[11px] font-semibold text-[#b8ab94]">
            {settingsOpen ? 'Fechar' : 'Gerenciar'}
          </button>
        </div>

        {step.step_key === 'invite_initial' ? (
          <div className="admin-scroll -mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
            <MiniMetric label="Amostra" value={step.metrics.assigned ?? 0} />
            <MiniMetric label="Enviados" value={step.metrics.sent ?? 0} />
            <MiniMetric label="Aberturas" value={step.metrics.opened ?? 0} helper={rate(step.metrics.opened, step.metrics.sent)} />
            <MiniMetric label="Cliques" value={step.metrics.clicked ?? 0} helper={rate(step.metrics.clicked, step.metrics.sent)} />
            <MiniMetric label="Ativações" value={step.metrics.activated ?? 0} helper={rate(step.metrics.activated, step.metrics.sent)} emphasis />
          </div>
        ) : step.metrics.contacts !== undefined ? (
          <div className="mt-4"><MiniMetric label="Contatos nesta etapa" value={step.metrics.contacts} /></div>
        ) : null}

        {settingsOpen ? (
          <div className="mt-4 rounded-2xl border border-white/8 bg-[#141008]/45 p-3.5 sm:p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff8f72]">Configuração da etapa</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-11 w-full rounded-xl border px-3 text-sm" /></Field>
              <Field label="Status"><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Step['status'] })} className="h-11 w-full rounded-xl border px-3 text-sm"><option value="draft">Rascunho</option><option value="active">Ativa</option><option value="paused">Pausada</option><option value="archived">Arquivada</option></select></Field>
              <Field label="Descrição" className="sm:col-span-2"><textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-xl border p-3 text-sm leading-5" /></Field>
              <Field label="Atraso antes do envio (min)"><input type="number" min={0} value={draft.delay} onChange={(e) => setDraft({ ...draft, delay: Math.max(0, Number(e.target.value) || 0) })} className="h-11 w-full rounded-xl border px-3 text-sm" /></Field>
              <button type="button" onClick={() => void onSaveStep(step, draft)} disabled={busy} className="h-11 self-end rounded-xl bg-[#ff7a59] px-4 text-sm font-bold text-[#141008] disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar etapa'}</button>
            </div>
          </div>
        ) : null}
      </div>

      {step.variants.length > 0 ? (
        <div className="border-t border-white/8 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8e8268]">Teste de mensagem</p>
            <span className="text-[10px] text-[#6f654f]">Deslize para comparar</span>
          </div>
          <div className="admin-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-3">
            {step.variants.map((variant) => {
              const metric = metrics.find((m) => m.variant_key === variant.variant_key)
              return (
                <div key={variant.id} className="min-w-[82vw] snap-center rounded-[1.35rem] border border-white/8 bg-[#1e1810] p-4 sm:min-w-[330px] xl:min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff8f72]">Variante {variant.variant_key}</p>
                      <h4 className="mt-1.5 text-base font-semibold leading-5 text-[#f5edde]">{variant.subject}</h4>
                    </div>
                    <button type="button" onClick={() => onEditVariant(variant)} className="shrink-0 rounded-xl border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[11px] font-semibold text-[#b8ab94]">Editar</button>
                  </div>

                  {metric ? (
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      <Tiny label="Abertura" value={rate(metric.opens, metric.sent)} />
                      <Tiny label="Clique" value={rate(metric.clicks, metric.sent)} />
                      <Tiny label="Ativação" value={rate(metric.activations, metric.sent)} strong />
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-2 text-xs leading-5 text-[#8e8268]">
                    <p><strong className="text-[#b8ab94]">Preheader:</strong> {variant.preheader || '—'}</p>
                    <p><strong className="text-[#b8ab94]">Headline:</strong> {variant.headline || '—'}</p>
                    <p className="line-clamp-5 whitespace-pre-line">{variant.body_text}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                    <span className="text-[10px] text-[#6f654f]">CTA</span>
                    <span className="text-[11px] font-bold text-[#ff8f72]">{variant.cta_label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="border-t border-white/8 p-4 text-sm text-[#8e8268]">Copy ainda não definida. Esta etapa continua pausada até ser construída e aprovada.</div>
      )}
    </article>
  )
}

function VariantEditor({ variant, draft, busy, onChange, onClose, onSave }: {
  variant: Variant
  draft: VariantDraft
  busy: boolean
  onChange: (draft: VariantDraft) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-5">
      <button aria-label="Fechar editor" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
      <section className="admin-bottom-nav relative z-10 max-h-[94dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#1e1810] px-4 pb-5 pt-3 shadow-2xl sm:max-w-2xl sm:rounded-[2rem] sm:p-6">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/10 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ff8f72]">Variante {variant.variant_key}</p>
            <h2 className="font-display mt-1 text-3xl leading-none text-[#f5edde]">Editar mensagem</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/8 px-3 py-2 text-xs font-semibold text-[#b8ab94]">Fechar</button>
        </div>

        <div className="mt-5 grid gap-3">
          <EditorField label="Assunto"><input value={draft.subject} onChange={(e) => onChange({ ...draft, subject: e.target.value })} className="h-12 w-full rounded-xl border px-3 text-sm" /></EditorField>
          <EditorField label="Preheader"><input value={draft.preheader} onChange={(e) => onChange({ ...draft, preheader: e.target.value })} className="h-12 w-full rounded-xl border px-3 text-sm" /></EditorField>
          <EditorField label="Headline"><input value={draft.headline} onChange={(e) => onChange({ ...draft, headline: e.target.value })} className="h-12 w-full rounded-xl border px-3 text-sm" /></EditorField>
          <EditorField label="Corpo"><textarea rows={11} value={draft.body_text} onChange={(e) => onChange({ ...draft, body_text: e.target.value })} className="w-full rounded-xl border p-3 text-sm leading-6" /></EditorField>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditorField label="CTA"><input value={draft.cta_label} onChange={(e) => onChange({ ...draft, cta_label: e.target.value })} className="h-12 w-full rounded-xl border px-3 text-sm" /></EditorField>
            <EditorField label="Destino"><input value={draft.cta_path} onChange={(e) => onChange({ ...draft, cta_path: e.target.value })} className="h-12 w-full rounded-xl border px-3 text-sm" /></EditorField>
          </div>
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 text-sm text-[#b8ab94]">
            Variante ativa no teste
            <input type="checkbox" checked={draft.is_active} onChange={(e) => onChange({ ...draft, is_active: e.target.checked })} className="h-5 w-5 accent-[#ff7a59]" />
          </label>
        </div>

        <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-white/8 bg-[#1e1810]/96 px-4 pb-2 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <button onClick={onSave} disabled={busy} className="h-12 flex-1 rounded-xl bg-[#ff7a59] px-4 text-sm font-bold text-[#141008] disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar variante'}</button>
          <button onClick={onClose} className="h-12 rounded-xl border border-white/10 px-4 text-sm font-semibold text-[#b8ab94]">Cancelar</button>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, helper, emphasis = false }: { label: string; value: number; helper?: string; emphasis?: boolean }) {
  return <div className={`min-w-[132px] snap-start rounded-[1.15rem] border p-3.5 md:min-w-0 ${emphasis ? 'border-[#ff7a59]/25 bg-[#ff7a59]/10' : 'border-white/8 bg-white/[0.025]'}`}><p className="text-[10px] font-medium text-[#8e8268]">{label}</p><p className={`mt-1 text-2xl font-bold ${emphasis ? 'text-[#ff9a80]' : 'text-[#f5edde]'}`}>{value}</p>{helper ? <p className="mt-0.5 text-[10px] text-[#6f654f]">{helper}</p> : null}</div>
}
function MiniMetric({ label, value, helper, emphasis = false }: { label: string; value: number; helper?: string; emphasis?: boolean }) {
  return <div className={`min-w-[112px] snap-start rounded-xl border px-3 py-2.5 sm:min-w-0 ${emphasis ? 'border-[#ff7a59]/25 bg-[#ff7a59]/10' : 'border-white/8 bg-white/[0.025]'}`}><p className="text-[10px] text-[#8e8268]">{label}</p><p className={`mt-0.5 text-lg font-bold ${emphasis ? 'text-[#ff9a80]' : 'text-[#f5edde]'}`}>{value}</p>{helper ? <p className="text-[10px] text-[#6f654f]">{helper}</p> : null}</div>
}
function Tiny({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`rounded-xl px-2 py-2 text-center ${strong ? 'bg-[#ff7a59]/10' : 'bg-white/[0.025]'}`}><p className="text-[9px] text-[#8e8268]">{label}</p><p className={`mt-0.5 text-sm font-bold ${strong ? 'text-[#ff9a80]' : 'text-[#f5edde]'}`}>{value}</p></div>
}
function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={`grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8e8268] ${className}`}>{label}{children}</label> }
function EditorField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-[11px] font-semibold text-[#b8ab94]">{label}{children}</label> }
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { active: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', paused: 'border-amber-400/20 bg-amber-400/10 text-amber-300', draft: 'border-white/8 bg-white/[0.035] text-[#8e8268]', archived: 'border-white/8 bg-white/[0.025] text-[#6f654f]' }
  const label: Record<string, string> = { active: 'Ativa', paused: 'Pausada', draft: 'Rascunho', archived: 'Arquivada' }
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${map[status] ?? map.draft}`}>{label[status] ?? status}</span>
}
function rate(num?: number, den?: number) { if (!den) return '0%'; return `${((Number(num ?? 0) / den) * 100).toFixed(1).replace('.', ',')}%` }
function channelLabel(channel: Step['channel']) { return channel === 'email' ? 'E-mail' : channel === 'whatsapp' ? 'WhatsApp' : 'Sistema' }
