'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

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

const CATEGORY_COLORS: Record<BenefitCategory, string> = {
  prato: 'bg-blue-100 text-blue-700',
  drink: 'bg-purple-100 text-purple-700',
  sobremesa: 'bg-pink-100 text-pink-700',
  combo: 'bg-orange-100 text-orange-700',
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
]

const DEFAULT_AVAILABILITY: AvailabilityDayRule[] = WEEKDAYS.map((day) => ({
  day: day.value,
  enabled: true,
  start: '11:00',
  end: day.value === 0 || day.value === 6 ? '23:00' : '22:00',
  dailyLimit: 20,
}))

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function toTimeInput(value: string | null | undefined): string {
  return (value || '').substring(0, 5) || '11:00'
}

function parsePriceToCents(value: string): number | null {
  if (!value.trim()) return null
  const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  if (Number.isNaN(num)) return null
  return Math.round(num * 100)
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<BenefitCategory>('prato')
  const [formOriginalPrice, setFormOriginalPrice] = useState('')
  const [formPromoType, setFormPromoType] = useState<'leve2pague1' | 'outro'>('leve2pague1')
  const [formPromoCustom, setFormPromoCustom] = useState('')
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
      .select('id')
      .eq('admin_user_id', user.id)
      .single()

    if (!restaurant) {
      setLoading(false)
      return
    }

    setRestaurantId(restaurant.id)

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
    setFormOriginalPrice(benefit.original_price ? (benefit.original_price / 100).toFixed(2).replace('.', ',') : '')
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
      setMessage({ type: 'error', text: 'Nao foi possivel salvar as regras. Tente novamente.' })
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
      setMessage({ type: 'error', text: 'Nao foi possivel salvar as regras. Tente novamente.' })
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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no maximo 5MB.' })
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
      setMessage({ type: 'error', text: 'Nome do prato e obrigatorio' })
      return
    }

    setSaving(true)
    setMessage(null)

    const priceInCents = parsePriceToCents(formOriginalPrice)
    const promoDescription =
      formPromoType === 'leve2pague1'
        ? 'Leve 2, pague 1'
        : formPromoCustom.trim() || 'Promocao personalizada'

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
          setMessage({ type: 'error', text: 'Nao foi possivel enviar a foto. Tente novamente.' })
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
        setMessage({ type: 'error', text: 'Nao foi possivel atualizar o prato. Tente novamente.' })
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
        setMessage({ type: 'error', text: 'Nao foi possivel criar o prato. Tente novamente.' })
        setSaving(false)
        return
      }

      if (formPhotoFile) {
        const photoUrl = await uploadPhoto(newBenefit.id)
        if (photoUrl) {
          await supabase.from('benefits').update({ photo_url: photoUrl }).eq('id', newBenefit.id)
        } else {
          setMessage({ type: 'error', text: 'Prato salvo, mas a foto nao foi enviada. Edite o prato para tentar de novo.' })
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

  async function toggleBenefit(id: string, currentActive: boolean) {
    const { error } = await supabase.from('benefits').update({ is_active: !currentActive }).eq('id', id)
    if (error) {
      console.error('[benefit-toggle] update failed', {
        code: error.code,
        hint: error.message,
      })
      setMessage({ type: 'error', text: 'Nao foi possivel alterar o status do prato. Tente novamente.' })
      return
    }
    setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !currentActive } : b)))
  }

  async function deleteBenefit(id: string) {
    const benefit = benefits.find((b) => b.id === id)
    if (benefit?.photo_url) {
      const match = benefit.photo_url.match(/restaurant-photos\/(.+)$/)
      if (match) await supabase.storage.from('restaurant-photos').remove([match[1]])
    }

    const { error } = await supabase.from('benefits').delete().eq('id', id)
    if (error) {
      console.error('[benefit-delete] delete failed', {
        code: error.code,
        hint: error.message,
      })
      setMessage({ type: 'error', text: 'Nao foi possivel excluir o prato. Tente novamente.' })
    } else {
      setBenefits((prev) => prev.filter((b) => b.id !== id))
      setMessage({ type: 'success', text: 'Prato removido.' })
    }
    setDeletingId(null)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pratos</h1>
          <p className="text-neutral-600">Cadastre pratos e defina uma disponibilidade unica para todos os pratos ativos.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            Novo prato
          </button>
        )}
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

      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Regras de disponibilidade</h2>
            <p className="text-sm text-neutral-500">Esses dias, horarios e limites valem para todos os pratos ativos.</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[860px] grid-cols-7 gap-3">
            {availabilityRules.map((rule) => (
              <div
                key={rule.day}
                className={`rounded-lg border p-3 ${
                  rule.enabled
                    ? 'border-orange-200 bg-orange-50/50'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{getWeekdayLabel(rule.day)}</span>
                  <button
                    type="button"
                    onClick={() => updateAvailabilityRule(rule.day, { enabled: !rule.enabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      rule.enabled ? 'bg-orange-600' : 'bg-neutral-300'
                    }`}
                    aria-label={`${rule.enabled ? 'Desativar' : 'Ativar'} ${getWeekdayLabel(rule.day)}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Inicio</label>
                  <input
                    type="time"
                    value={rule.start}
                    onChange={(e) => updateAvailabilityRule(rule.day, { start: e.target.value })}
                    disabled={!rule.enabled}
                    className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Fim</label>
                  <input
                    type="time"
                    value={rule.end}
                    onChange={(e) => updateAvailabilityRule(rule.day, { end: e.target.value })}
                    disabled={!rule.enabled}
                    className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Limite diario</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={rule.dailyLimit}
                    onChange={(e) => updateAvailabilityRule(rule.day, { dailyLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                    disabled={!rule.enabled}
                    className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                  {!rule.enabled && (
                    <p className="text-xs font-medium text-neutral-500">Indisponivel</p>
                  )}
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            Disponibilidade: {availabilityRules
              .filter((rule) => rule.enabled)
              .map((rule) => `${getWeekdayLabel(rule.day)} ${rule.start}-${rule.end} Max ${rule.dailyLimit}/dia`)
              .join(' | ') || 'Nenhuma disponibilidade configurada'}
          </p>
          <button
            type="button"
            onClick={saveAvailability}
            disabled={savingAvailability}
            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {savingAvailability ? 'Salvando...' : 'Salvar regras'}
          </button>
        </div>
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
                <p className="text-xs text-neutral-500">JPG, PNG ou WebP. Max 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label className="mb-1 block text-sm font-medium text-neutral-700">Descricao</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Descreva o prato..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Preco original</label>
                <input
                  type="text"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                  placeholder="Ex: 45,90"
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
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg text-neutral-500">Nenhum prato cadastrado ainda</p>
          <p className="mt-1 text-sm text-neutral-400">
            Clique em &quot;Novo prato&quot; para comecar a montar seu cardapio +um.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm transition-opacity ${
                benefit.is_active ? 'border-neutral-200' : 'border-neutral-100 opacity-60'
              }`}
            >
              {benefit.photo_url ? (
                <div className="h-40 w-full overflow-hidden bg-neutral-100">
                  <img src={benefit.photo_url} alt={benefit.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
                  Sem foto
                </div>
              )}

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">{benefit.name}</h3>
                    {benefit.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500">{benefit.description}</p>
                    )}
                  </div>
                  <span className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[benefit.category]}`}>
                    {CATEGORIES.find((c) => c.value === benefit.category)?.label}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {benefit.original_price && (
                    <span className="text-sm font-semibold text-orange-600">{formatPrice(benefit.original_price)}</span>
                  )}
                  {benefit.promo_description && (
                    <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      {benefit.promo_description}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleBenefit(benefit.id, benefit.is_active)}
                    aria-label={`${benefit.is_active ? 'Desativar' : 'Ativar'} prato ${benefit.name}`}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      benefit.is_active ? 'bg-orange-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      benefit.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(benefit)}
                      className="rounded px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                    >
                      Editar
                    </button>
                    {deletingId === benefit.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deleteBenefit(benefit.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="rounded px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(benefit.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
