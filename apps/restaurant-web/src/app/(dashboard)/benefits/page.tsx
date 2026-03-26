'use client'

import { useEffect, useState, useRef } from 'react'
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

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function formatDaysSummary(days: number[]): string {
  if (days.length === 7) return 'Todos os dias'
  if (days.length === 0) return 'Nenhum dia'
  return days.map((d) => WEEKDAYS[d]?.label).join(', ')
}

const supabase = createClient()

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [rulesMap, setRulesMap] = useState<Record<string, BenefitRule>>({})
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<BenefitCategory>('prato')
  const [formOriginalPrice, setFormOriginalPrice] = useState('')
  const [formPromoType, setFormPromoType] = useState<'leve2pague1' | 'outro' | ''>('')
  const [formPromoCustom, setFormPromoCustom] = useState('')
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Per-benefit rules form — multiple time slots
  interface RuleSlot { days: number[]; start: string; end: string }
  const [formRuleSlots, setFormRuleSlots] = useState<RuleSlot[]>([
    { days: [1, 2, 3, 4, 5], start: '11:00', end: '22:00' },
  ])
  const [formRuleLimit, setFormRuleLimit] = useState(20)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('admin_user_id', user.id)
      .single()

    if (!restaurant) { setLoading(false); return }

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
        .eq('restaurant_id', restaurant.id),
    ])

    if (benefitsRes.data) setBenefits(benefitsRes.data)

    if (rulesRes.data) {
      const map: Record<string, BenefitRule> = {}
      for (const rule of rulesRes.data) {
        if (rule.benefit_id) {
          map[rule.benefit_id] = rule
        }
      }
      setRulesMap(map)
    }

    setLoading(false)
  }

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormCategory('prato')
    setFormOriginalPrice('')
    setFormPromoType('')
    setFormPromoCustom('')
    setFormPhotoFile(null)
    setFormPhotoPreview(null)
    setFormRuleSlots([{ days: [1, 2, 3, 4, 5], start: '11:00', end: '22:00' }])
    setFormRuleLimit(20)
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
      setFormPromoType('')
      setFormPromoCustom('')
    }
    setFormPhotoFile(null)
    setFormPhotoPreview(benefit.photo_url)
    setEditingId(benefit.id)

    const rule = rulesMap[benefit.id]
    if (rule) {
      setFormRuleSlots([{
        days: rule.available_days || [1, 2, 3, 4, 5],
        start: rule.available_hours_start || '11:00',
        end: rule.available_hours_end || '22:00',
      }])
      setFormRuleLimit(rule.daily_limit || 20)
    } else {
      setFormRuleSlots([{ days: [1, 2, 3, 4, 5], start: '11:00', end: '22:00' }])
      setFormRuleLimit(20)
    }

    setShowForm(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Imagem deve ter no maximo 5MB' })
      return
    }

    setFormPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setFormPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function parsePriceToCents(value: string): number | null {
    if (!value.trim()) return null
    const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    if (isNaN(num)) return null
    return Math.round(num * 100)
  }

  async function uploadPhoto(benefitId: string): Promise<string | null> {
    if (!formPhotoFile) return null

    const ext = formPhotoFile.name.split('.').pop() || 'jpg'
    const filePath = `benefits/${benefitId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('restaurant-photos')
      .upload(filePath, formPhotoFile, { upsert: true })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantId) return

    if (!formName.trim()) {
      setMessage({ type: 'error', text: 'Nome do prato e obrigatorio' })
      return
    }

    const hasValidSlot = formRuleSlots.some(s => s.days.length > 0)
    if (!hasValidSlot) {
      setMessage({ type: 'error', text: 'Selecione pelo menos 1 dia da semana em algum horario' })
      return
    }

    setSaving(true)
    setMessage(null)

    const priceInCents = parsePriceToCents(formOriginalPrice)
    const promoDescription = formPromoType === 'leve2pague1'
      ? 'Leve 2, pague 1'
      : formPromoType === 'outro'
        ? formPromoCustom.trim() || null
        : null

    if (editingId) {
      // Update benefit
      const updateData: Record<string, unknown> = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        original_price: priceInCents,
        promo_description: promoDescription,
      }

      if (formPhotoFile) {
        const photoUrl = await uploadPhoto(editingId)
        if (photoUrl) {
          updateData.photo_url = photoUrl
        } else {
          setMessage({ type: 'error', text: 'Erro ao enviar foto. Tente novamente.' })
          setSaving(false)
          return
        }
      }

      const { error } = await supabase.from('benefits').update(updateData).eq('id', editingId)

      if (error) {
        setMessage({ type: 'error', text: `Erro ao atualizar: ${error.message}` })
        setSaving(false)
        return
      }

      // Upsert rule
      const ruleError = await upsertRule(editingId)
      if (ruleError) {
        setMessage({ type: 'error', text: `Prato atualizado, mas erro nas regras: ${ruleError}` })
        resetForm()
        await loadData()
        setSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Prato atualizado!' })
    } else {
      // Insert benefit
      const { data: newBenefit, error } = await supabase
        .from('benefits')
        .insert({
          restaurant_id: restaurantId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
          original_price: priceInCents,
          promo_description: promoDescription,
        })
        .select('id')
        .single()

      if (error || !newBenefit) {
        setMessage({ type: 'error', text: `Erro ao criar: ${error?.message}` })
        setSaving(false)
        return
      }

      // Upload photo
      if (formPhotoFile) {
        const photoUrl = await uploadPhoto(newBenefit.id)
        if (photoUrl) {
          await supabase.from('benefits').update({ photo_url: photoUrl }).eq('id', newBenefit.id)
        } else {
          setMessage({ type: 'error', text: 'Prato criado, mas a foto nao foi enviada. Edite para tentar novamente.' })
          resetForm()
          await loadData()
          setSaving(false)
          return
        }
      }

      // Create rule
      const ruleError = await upsertRule(newBenefit.id)
      if (ruleError) {
        setMessage({ type: 'error', text: `Prato criado, mas erro nas regras: ${ruleError}` })
        resetForm()
        await loadData()
        setSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Prato adicionado!' })
    }

    resetForm()
    await loadData()
    setSaving(false)
  }

  async function upsertRule(benefitId: string): Promise<string | null> {
    if (!restaurantId) return 'Restaurant ID ausente'

    // Merge all slot days into one rule (DB stores 1 rule per benefit)
    // Use first slot hours as primary, combine all days
    const allDays = [...new Set(formRuleSlots.flatMap(s => s.days))].sort()
    const primarySlot = formRuleSlots[0] || { start: '11:00', end: '22:00' }

    const ruleData = {
      restaurant_id: restaurantId,
      benefit_id: benefitId,
      available_days: allDays,
      available_hours_start: primarySlot.start,
      available_hours_end: primarySlot.end,
      daily_limit: formRuleLimit,
      is_active: true,
    }

    const existingRule = rulesMap[benefitId]
    if (existingRule) {
      const { error } = await supabase.from('benefit_rules').update(ruleData).eq('id', existingRule.id)
      if (error) return error.message
    } else {
      const { error } = await supabase.from('benefit_rules').insert(ruleData)
      if (error) return error.message
    }
    return null
  }

  async function toggleBenefit(id: string, currentActive: boolean) {
    const { error } = await supabase.from('benefits').update({ is_active: !currentActive }).eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: `Erro: ${error.message}` })
      return
    }
    setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !currentActive } : b)))
  }

  async function deleteBenefit(id: string) {
    // Clean up photo from Storage if exists
    const benefit = benefits.find((b) => b.id === id)
    if (benefit?.photo_url) {
      const url = benefit.photo_url
      const match = url.match(/restaurant-photos\/(.+)$/)
      if (match) {
        await supabase.storage.from('restaurant-photos').remove([match[1]])
      }
    }

    const { error } = await supabase.from('benefits').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: `Erro ao deletar: ${error.message}` })
    } else {
      setBenefits((prev) => prev.filter((b) => b.id !== id))
      setMessage({ type: 'success', text: 'Prato removido!' })
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cardapio +um</h1>
          <p className="text-neutral-600">Cadastre os pratos e configure as regras de cada promocao</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            + Novo Prato
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border border-green-200 bg-green-50 text-green-800'
            : 'border border-red-200 bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form — Create / Edit */}
      {showForm && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">
            {editingId ? 'Editar Prato' : 'Novo Prato'}
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Foto do Prato</label>
              <div className="flex items-center gap-4">
                {formPhotoPreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200">
                    <img src={formPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setFormPhotoFile(null); setFormPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-orange-400 hover:text-orange-500"
                  >
                    <span className="text-2xl">+</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-neutral-500">JPG, PNG ou WebP. Max 5MB.</p>
              </div>
            </div>

            {/* Name + Category */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Nome do Prato *</label>
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
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
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

            {/* Price + Promo */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Preco Original</label>
                <input
                  type="text"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                  placeholder="Ex: 45,90"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-neutral-400">O cliente ve o valor para entender o beneficio</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Promocao</label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="promoType"
                      checked={formPromoType === ''}
                      onChange={() => { setFormPromoType(''); setFormPromoCustom('') }}
                      className="h-4 w-4 accent-orange-600"
                    />
                    <span className="text-sm text-neutral-600">Sem promocao</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="promoType"
                      checked={formPromoType === 'leve2pague1'}
                      onChange={() => { setFormPromoType('leve2pague1'); setFormPromoCustom('') }}
                      className="h-4 w-4 accent-orange-600"
                    />
                    <span className="text-sm text-neutral-700 font-medium">Leve 2, pague 1</span>
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
                    <div className="ml-6">
                      <input
                        type="text"
                        value={formPromoCustom}
                        onChange={(e) => setFormPromoCustom(e.target.value)}
                        placeholder="Descreva a promocao (sujeita a aprovacao)"
                        className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <p className="mt-1 text-xs text-amber-600">Promocoes personalizadas precisam de aprovacao do admin +um</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Availability Rules */}
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-800">Regras de Disponibilidade</h3>
                {formRuleSlots.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setFormRuleSlots([...formRuleSlots, { days: [0, 6], start: '11:00', end: '16:00' }])}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    + Adicionar horario
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {formRuleSlots.map((slot, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">
                        {idx === 0 ? 'Horario principal' : `Horario ${idx + 1}`}
                      </span>
                      {formRuleSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormRuleSlots(formRuleSlots.filter((_, i) => i !== idx))}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    {/* Days */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const updated = [...formRuleSlots]
                            const s = updated[idx]
                            s.days = s.days.includes(day.value)
                              ? s.days.filter((d) => d !== day.value)
                              : [...s.days, day.value].sort()
                            setFormRuleSlots(updated)
                          }}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            slot.days.includes(day.value)
                              ? 'bg-orange-600 text-white'
                              : 'border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">Inicio</label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const updated = [...formRuleSlots]
                            updated[idx].start = e.target.value
                            setFormRuleSlots(updated)
                          }}
                          className="h-8 w-full rounded-md border border-neutral-300 px-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">Fim</label>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const updated = [...formRuleSlots]
                            updated[idx].end = e.target.value
                            setFormRuleSlots(updated)
                          }}
                          className="h-8 w-full rounded-md border border-neutral-300 px-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily limit */}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Limite Diario de Cupons</label>
                <input
                  type="number"
                  value={formRuleLimit}
                  onChange={(e) => setFormRuleLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={999}
                  className="h-9 w-32 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
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

      {/* Benefits Cards */}
      {benefits.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg text-neutral-500">Nenhum prato cadastrado ainda</p>
          <p className="mt-1 text-sm text-neutral-400">
            Clique em &quot;+ Novo Prato&quot; para comecar a montar seu cardapio +um.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit) => {
            const rule = rulesMap[benefit.id]
            return (
              <div
                key={benefit.id}
                className={`overflow-hidden rounded-lg border bg-white shadow-sm transition-opacity ${
                  benefit.is_active ? 'border-neutral-200' : 'border-neutral-100 opacity-60'
                }`}
              >
                {/* Photo */}
                {benefit.photo_url ? (
                  <div className="h-40 w-full overflow-hidden bg-neutral-100">
                    <img src={benefit.photo_url} alt={benefit.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-neutral-100">
                    <span className="text-3xl">
                      {benefit.category === 'prato' ? '🍽️' : benefit.category === 'drink' ? '🥤' : benefit.category === 'sobremesa' ? '🍰' : '🎁'}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{benefit.name}</h3>
                      {benefit.description && (
                        <p className="mt-0.5 text-sm text-neutral-500 line-clamp-2">{benefit.description}</p>
                      )}
                    </div>
                    <span className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[benefit.category]}`}>
                      {CATEGORIES.find((c) => c.value === benefit.category)?.label}
                    </span>
                  </div>

                  {/* Price + Promo */}
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

                  {/* Rules Summary */}
                  {rule && (
                    <div className="mb-3 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                      <span className="font-medium">{formatDaysSummary(rule.available_days)}</span>
                      {' · '}
                      {rule.available_hours_start?.substring(0, 5)} - {rule.available_hours_end?.substring(0, 5)}
                      {' · '}
                      Max {rule.daily_limit}/dia
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <button
                      onClick={() => toggleBenefit(benefit.id, benefit.is_active)}
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
                        onClick={() => startEdit(benefit)}
                        className="rounded px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                      >
                        Editar
                      </button>
                      {deletingId === benefit.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteBenefit(benefit.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rounded px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
                          >
                            Nao
                          </button>
                        </div>
                      ) : (
                        <button
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
            )
          })}
        </div>
      )}
    </div>
  )
}
