'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'
import { Plus } from '@phosphor-icons/react'

type BenefitCategory = 'prato' | 'drink' | 'sobremesa' | 'combo'

interface Benefit {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  category: BenefitCategory
  photo_url: string | null
  original_price: number | null
  promo_description: string | null
  is_active: boolean
}

interface BenefitRule {
  id: string
  restaurant_id: string
  benefit_id: string | null
  available_days: number[]
  available_hours_start: string
  available_hours_end: string
  daily_limit: number
  is_active: boolean
}

interface AvailabilityDayRule {
  day: number
  enabled: boolean
  start: string
  end: string
  dailyLimit: number
}

const CATEGORIES: { value: BenefitCategory; label: string }[] = [
  { value: 'prato', label: 'Prato' },
  { value: 'drink', label: 'Drink' },
  { value: 'sobremesa', label: 'Sobremesa' },
  { value: 'combo', label: 'Combo' },
]

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
]

const REUSE_INTERVAL_OPTIONS = [
  { value: 365, label: '365 dias' },
  { value: 180, label: '180 dias' },
  { value: 90, label: '90 dias' },
  { value: 30, label: '30 dias' },
  { value: 0, label: 'Sem intervalo' },
]

const DEFAULT_AVAILABILITY: AvailabilityDayRule[] = WEEKDAYS.map((day) => ({
  day: day.value,
  enabled: true,
  start: '11:00',
  end: day.value === 0 || day.value === 6 ? '23:00' : '22:00',
  dailyLimit: 20,
}))

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function toTimeInput(value: string | null | undefined): string {
  return (value || '').substring(0, 5) || '11:00'
}

function parsePriceToCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  if (!normalized) return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  const cents = Math.round(parsed * 100)
  return cents <= 99999 ? cents : null
}

function maskPriceInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 5)
  if (!digits) return ''

  const padded = digits.padStart(3, '0')
  const reais = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  const centavos = padded.slice(-2)

  return `${reais || '0'},${centavos}`
}

function priceTextFromCents(cents: number | null): string {
  if (!cents || cents <= 0) return ''
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function rulesToDayRules(rules: BenefitRule[]): AvailabilityDayRule[] {
  const activeRules = rules.filter((rule) => !rule.benefit_id && rule.is_active)

  if (activeRules.length === 0) return DEFAULT_AVAILABILITY

  const rulesByDay = new Map<number, AvailabilityDayRule>()
  for (const rule of DEFAULT_AVAILABILITY) {
    rulesByDay.set(rule.day, { ...rule, enabled: false })
  }

  for (const rule of activeRules) {
    for (const day of rule.available_days || []) {
      if (day < 0 || day > 6) continue
      rulesByDay.set(day, {
        day,
        enabled: true,
        start: toTimeInput(rule.available_hours_start),
        end: toTimeInput(rule.available_hours_end),
        dailyLimit: rule.daily_limit || 20,
      })
    }
  }

  return WEEKDAYS.map((day) => rulesByDay.get(day.value) || {
    day: day.value,
    enabled: false,
    start: '11:00',
    end: '22:00',
    dailyLimit: 20,
  })
}

const supabase = createClient()

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityDayRule[]>(DEFAULT_AVAILABILITY)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [reuseIntervalDays, setReuseIntervalDays] = useState(365)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [savingReuseInterval, setSavingReuseInterval] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false)
  const [showReturnRulesModal, setShowReturnRulesModal] = useState(false)
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<BenefitCategory>('prato')
  const [formOriginalPrice, setFormOriginalPrice] = useState('')
  const [formPromoType, setFormPromoType] = useState<'leve2pague1' | 'outro'>('leve2pague1')
  const [formPromoCustom, setFormPromoCustom] = useState('')
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name, experience_reuse_interval_days')
      .eq('admin_user_id', user.id)
      .single()

    if (!restaurant) {
      setLoading(false)
      return
    }

    setRestaurantId(restaurant.id)
    setRestaurantName(restaurant.name || '')
    setReuseIntervalDays(restaurant.experience_reuse_interval_days ?? 365)

    const [benefitsRes, rulesRes] = await Promise.all([
      supabase
        .from('benefits')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('benefit_rules')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .is('benefit_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
    ])

    if (benefitsRes.data) setBenefits(benefitsRes.data)
    if (rulesRes.data) setAvailabilityRules(rulesToDayRules(rulesRes.data as BenefitRule[]))
    setLoading(false)
  }

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormCategory('prato')
    setFormOriginalPrice('')
    setFormPromoType('leve2pague1')
    setFormPromoCustom('')
    setFormPhotoFile(null)
    setFormPhotoPreview(null)
    setEditingId(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startEdit(benefit: Benefit) {
    setFormName(benefit.name)
    setFormDescription(benefit.description || '')
    setFormCategory(benefit.category)
    setFormOriginalPrice(priceTextFromCents(benefit.original_price))
    if (benefit.promo_description === 'Leve 2, pague 1') {
      setFormPromoType('leve2pague1')
      setFormPromoCustom('')
    } else if (benefit.promo_description) {
      setFormPromoType('outro')
      setFormPromoCustom(benefit.promo_description)
    } else {
      setFormPromoType('leve2pague1')
      setFormPromoCustom('')
    }
    setFormPhotoFile(null)
    setFormPhotoPreview(benefit.photo_url)
    setEditingId(benefit.id)
    setShowForm(true)
  }

  function updateAvailabilityRule(day: number, patch: Partial<AvailabilityDayRule>) {
    setAvailabilityRules((current) =>
      current.map((rule) => (rule.day === day ? { ...rule, ...patch } : rule)),
    )
  }

  function applySelectedScheduleToEnabledDays() {
    const selected = availabilityRules.find((rule) => rule.day === selectedAvailabilityDay)
    if (!selected) return
    setAvailabilityRules((current) =>
      current.map((rule) =>
        rule.enabled
          ? {
              ...rule,
              start: selected.start,
              end: selected.end,
              dailyLimit: selected.dailyLimit,
            }
          : rule,
      ),
    )
  }

  function getWeekdayLabel(day: number) {
    return WEEKDAYS.find((weekday) => weekday.value === day)?.label || ''
  }

  async function saveAvailability() {
    if (!restaurantId) return

    const enabledRules = availabilityRules
      .filter((rule) => rule.enabled)
      .map((rule) => ({
        ...rule,
        dailyLimit: Math.max(1, rule.dailyLimit || 1),
      }))

    if (enabledRules.length === 0) {
      setMessage({ type: 'error', text: 'Configure pelo menos um dia de disponibilidade.' })
      return
    }

    setSavingAvailability(true)
    setMessage(null)

    const { error: deleteError } = await supabase
      .from('benefit_rules')
      .delete()
      .eq('restaurant_id', restaurantId)

    if (deleteError) {
      console.error('[availability-save] cleanup failed', {
        code: deleteError.code,
        hint: deleteError.message,
      })
      setMessage({ type: 'error', text: 'Não foi possível salvar as regras. Tente novamente.' })
      setSavingAvailability(false)
      return
    }

    const rows = enabledRules.map((rule) => ({
      restaurant_id: restaurantId,
      benefit_id: null,
      available_days: [rule.day],
      available_hours_start: rule.start,
      available_hours_end: rule.end,
      daily_limit: rule.dailyLimit,
      is_active: true,
    }))

    const { error: insertError } = await supabase.from('benefit_rules').insert(rows)

    if (insertError) {
      console.error('[availability-save] insert failed', {
        code: insertError.code,
        hint: insertError.message,
      })
      setMessage({ type: 'error', text: 'Não foi possível salvar as regras. Tente novamente.' })
      setSavingAvailability(false)
      return
    }

    setAvailabilityRules((current) =>
      current.map((rule) => ({
        ...rule,
        dailyLimit: Math.max(1, rule.dailyLimit || 1),
      })),
    )
    setMessage({ type: 'success', text: 'Regras de disponibilidade atualizadas para todos os pratos.' })
    setSavingAvailability(false)
  }

  async function saveReuseInterval() {
    if (!restaurantId) return
    if (!REUSE_INTERVAL_OPTIONS.some((option) => option.value === reuseIntervalDays)) {
      setMessage({ type: 'error', text: 'Escolha um intervalo de retorno valido.' })
      return
    }

    setSavingReuseInterval(true)
    setMessage(null)

    const { error } = await supabase
      .from('restaurants')
      .update({ experience_reuse_interval_days: reuseIntervalDays })
      .eq('id', restaurantId)

    if (error) {
      console.error('[reuse-interval-save] update failed', {
        code: error.code,
        hint: error.message,
      })
      setMessage({ type: 'error', text: 'Nao foi possivel salvar o intervalo de retorno.' })
      setSavingReuseInterval(false)
      return
    }

    setMessage({ type: 'success', text: 'Intervalo de retorno atualizado.' })
    setShowReturnRulesModal(false)
    setSavingReuseInterval(false)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    setFormPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setFormPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadPhoto(benefitId: string): Promise<string | null> {
    if (!formPhotoFile) return null

    const ext = formPhotoFile.name.split('.').pop() || 'jpg'
    const filePath = `benefits/${benefitId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('restaurant-photos')
      .upload(filePath, formPhotoFile, { upsert: true })

    if (error) {
      console.error('[benefit-photo-upload] storage error', {
        code: error.name,
        hint: error.message,
      })
      return null
    }

    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(filePath)
    return `${data.publicUrl}?v=${Date.now()}`
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantId) return

    if (!formName.trim()) {
      setMessage({ type: 'error', text: 'Nome do prato é obrigatório.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const priceInCents = parsePriceToCents(formOriginalPrice)
    const promoDescription =
      formPromoType === 'leve2pague1'
        ? 'Leve 2, pague 1'
        : formPromoCustom.trim() || 'Promoção personalizada'

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      category: formCategory,
      original_price: priceInCents,
      promo_description: promoDescription,
    }

    if (editingId) {
      const updateData: Record<string, unknown> = { ...payload }
      if (formPhotoFile) {
        const photoUrl = await uploadPhoto(editingId)
        if (!photoUrl) {
          setMessage({ type: 'error', text: 'Não foi possível enviar a foto. Tente novamente.' })
          setSaving(false)
          return
        }
        updateData.photo_url = photoUrl
      }

      const { error } = await supabase.from('benefits').update(updateData).eq('id', editingId)
      if (error) {
        console.error('[benefit-save] update failed', {
          code: error.code,
          hint: error.message,
        })
        setMessage({ type: 'error', text: 'Não foi possível atualizar o prato. Tente novamente.' })
        setSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Prato atualizado.' })
    } else {
      const { data: newBenefit, error } = await supabase
        .from('benefits')
        .insert({ restaurant_id: restaurantId, ...payload })
        .select('id')
        .single()

      if (error || !newBenefit) {
        console.error('[benefit-save] create failed', {
          code: error?.code,
          hint: error?.message,
        })
        setMessage({ type: 'error', text: 'Não foi possível criar o prato. Tente novamente.' })
        setSaving(false)
        return
      }

      if (formPhotoFile) {
        const photoUrl = await uploadPhoto(newBenefit.id)
        if (photoUrl) {
          await supabase.from('benefits').update({ photo_url: photoUrl }).eq('id', newBenefit.id)
        } else {
          setMessage({ type: 'error', text: 'Prato salvo, mas a foto não foi enviada. Edite o prato para tentar de novo.' })
          resetForm()
          await loadData()
          setSaving(false)
          return
        }
      }

      setMessage({ type: 'success', text: 'Prato adicionado.' })
    }

    resetForm()
    await loadData()
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      </div>
    )
  }

  if (!restaurantId) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-600">Nenhum restaurante vinculado a sua conta.</p>
      </div>
    )
  }

  const enabledAvailabilityRules = availabilityRules.filter((rule) => rule.enabled)
  const availabilityDays = enabledAvailabilityRules
    .map((rule) => getWeekdayLabel(rule.day).toLowerCase())
    .join(', ')
  const usesSameAvailabilityWindow =
    enabledAvailabilityRules.length > 0 &&
    enabledAvailabilityRules.every(
      (rule) =>
        rule.start === enabledAvailabilityRules[0].start &&
        rule.end === enabledAvailabilityRules[0].end,
    )
  const availabilitySummary =
    enabledAvailabilityRules.length === 0
      ? 'Nenhuma disponibilidade configurada'
      : usesSameAvailabilityWindow
        ? `${availabilityDays}, ${enabledAvailabilityRules[0].start}-${enabledAvailabilityRules[0].end}`
        : enabledAvailabilityRules
            .map((rule) => `${getWeekdayLabel(rule.day).toLowerCase()} ${rule.start}-${rule.end}`)
            .join(' | ')
  const selectedAvailabilityRule =
    availabilityRules.find((rule) => rule.day === selectedAvailabilityDay) || availabilityRules[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pratos</h1>
        </div>
      </div>

      {message && (
        <div role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border border-green-200 bg-green-50 text-green-800'
            : 'border border-red-200 bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Disponibilidade dos pratos</h2>
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{availabilitySummary}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowReturnRulesModal(true)}
              className="min-h-10 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Regras de retorno
            </button>
            <button
              type="button"
              onClick={() => setShowAvailabilityEditor((current) => !current)}
              className="min-h-10 w-full rounded-lg border border-orange-300 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
              aria-expanded={showAvailabilityEditor}
            >
              {showAvailabilityEditor ? 'Fechar disponibilidade' : 'Editar disponibilidade'}
            </button>
          </div>
        </div>

        {showAvailabilityEditor && (
          <>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Dias ativos</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {availabilityRules.map((rule) => {
                    const selected = rule.day === selectedAvailabilityDay
                    return (
                      <button
                        key={rule.day}
                        type="button"
                        onClick={() => setSelectedAvailabilityDay(rule.day)}
                        aria-pressed={rule.enabled}
                        className={`min-h-11 rounded-lg border text-xs font-bold transition-colors ${
                          rule.enabled
                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                        } ${selected ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
                      >
                        {getWeekdayLabel(rule.day)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedAvailabilityRule && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-500">Ajuste fino</p>
                      <h3 className="text-base font-semibold text-neutral-900">
                        {getWeekdayLabel(selectedAvailabilityRule.day)}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateAvailabilityRule(selectedAvailabilityRule.day, {
                          enabled: !selectedAvailabilityRule.enabled,
                        })
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                        selectedAvailabilityRule.enabled ? 'bg-orange-600' : 'bg-neutral-300'
                      }`}
                      aria-label={`${selectedAvailabilityRule.enabled ? 'Desativar' : 'Ativar'} ${getWeekdayLabel(selectedAvailabilityRule.day)}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        selectedAvailabilityRule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500">Inicio</label>
                      <input
                        type="time"
                        value={selectedAvailabilityRule.start}
                        onChange={(e) =>
                          updateAvailabilityRule(selectedAvailabilityRule.day, { start: e.target.value })
                        }
                        disabled={!selectedAvailabilityRule.enabled}
                        className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-500">Fim</label>
                      <input
                        type="time"
                        value={selectedAvailabilityRule.end}
                        onChange={(e) =>
                          updateAvailabilityRule(selectedAvailabilityRule.day, { end: e.target.value })
                        }
                        disabled={!selectedAvailabilityRule.enabled}
                        className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={applySelectedScheduleToEnabledDays}
                    className="mt-3 min-h-10 w-full rounded-lg border border-orange-300 bg-orange-50 px-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                  >
                    Aplicar este horario aos dias ativos
                  </button>
                </div>
              )}
            </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            Disponibilidade: {availabilitySummary}
          </p>
          <button
            type="button"
            onClick={saveAvailability}
            disabled={savingAvailability}
            className="min-h-11 w-full rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {savingAvailability ? 'Salvando...' : 'Salvar disponibilidade'}
          </button>
        </div>
          </>
        )}
      </section>

      {showForm && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">
            {editingId ? 'Editar prato' : 'Novo prato'}
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Foto do prato</label>
              <div className="flex items-center gap-4">
                {formPhotoPreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200">
                    <img src={formPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remover foto do prato"
                      onClick={() => {
                        setFormPhotoFile(null)
                        setFormPhotoPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-orange-400 hover:text-orange-500"
                    aria-label="Adicionar foto do prato"
                  >
                    <span className="text-2xl">+</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <p className="text-xs text-neutral-500">JPG, PNG ou WebP. Máximo 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Nome do prato *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Picanha na Brasa"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Categoria *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as BenefitCategory)}
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Descrição</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Descreva o prato..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Preço original</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(maskPriceInput(e.target.value))}
                  placeholder="Ex.: 45,90"
                  maxLength={6}
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Oferta *</label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="promoType"
                      checked={formPromoType === 'leve2pague1'}
                      onChange={() => {
                        setFormPromoType('leve2pague1')
                        setFormPromoCustom('')
                      }}
                      className="h-4 w-4 accent-orange-600"
                    />
                    <span className="text-sm font-medium text-neutral-700">Leve 2, pague 1</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="promoType"
                      checked={formPromoType === 'outro'}
                      onChange={() => setFormPromoType('outro')}
                      className="h-4 w-4 accent-orange-600"
                    />
                    <span className="text-sm text-neutral-600">Outro</span>
                  </label>
                  {formPromoType === 'outro' && (
                    <input
                      type="text"
                      value={formPromoCustom}
                      onChange={(e) => setFormPromoCustom(e.target.value)}
                      placeholder="Descreva a oferta"
                      className="ml-6 h-9 w-[calc(100%-1.5rem)] rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar prato' : 'Adicionar prato'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-neutral-300 px-6 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {benefits.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg text-neutral-500">Nenhum prato cadastrado ainda</p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Plus size={18} weight="bold" aria-hidden="true" />
              Novo prato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="rounded-2xl border border-[#2c2115] bg-[#100b06] p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-base font-bold text-white">
                      {benefit.name}
                    </h3>
                    {benefit.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#dfc89c]">
                        {benefit.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-orange-600">
                      {restaurantName || CATEGORIES.find((c) => c.value === benefit.category)?.label}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {benefit.original_price ? formatPrice(benefit.original_price) : 'Consulte valor'}
                      </span>
                      {benefit.promo_description && (
                        <span className="text-xs font-bold text-orange-500">
                          {benefit.promo_description}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-1 text-xs text-[#8f8068]">
                      {availabilitySummary}
                    </p>
                  </div>

                  <div className="w-28 shrink-0">
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#1b140d]">
                      {benefit.photo_url ? (
                        <img src={benefit.photo_url} alt={benefit.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#8f8068]">
                          Sem foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startEdit(benefit)}
                  className="mt-3 min-h-10 w-full rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 text-sm font-semibold text-orange-500 transition-colors hover:bg-orange-500/20"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Plus size={18} weight="bold" aria-hidden="true" />
              Novo prato
            </button>
          )}
        </div>
      )}

      {showReturnRulesModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 px-4 pb-4 pt-12 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Regras de retorno</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Defina quando o mesmo cliente pode usar uma nova experiencia neste estabelecimento.
              </p>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Cliente pode voltar apos</span>
              <select
                value={reuseIntervalDays}
                onChange={(event) => setReuseIntervalDays(Number(event.target.value))}
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {REUSE_INTERVAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowReturnRulesModal(false)}
                className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveReuseInterval}
                disabled={savingReuseInterval}
                className="min-h-11 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingReuseInterval ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
