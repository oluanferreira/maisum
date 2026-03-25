'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

type BenefitCategory = 'prato' | 'drink' | 'sobremesa' | 'combo'

interface Benefit {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  category: BenefitCategory
  is_active: boolean
}

interface BenefitRule {
  id: string
  restaurant_id: string
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

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [rule, setRule] = useState<BenefitRule | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New benefit form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<BenefitCategory>('prato')
  const [savingBenefit, setSavingBenefit] = useState(false)

  // Rules form
  const [ruleDays, setRuleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [ruleStart, setRuleStart] = useState('00:00')
  const [ruleEnd, setRuleEnd] = useState('23:59')
  const [ruleLimit, setRuleLimit] = useState(50)
  const [ruleActive, setRuleActive] = useState(true)
  const [savingRule, setSavingRule] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Get restaurant ID
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

    // Load benefits and rules in parallel
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
        .single(),
    ])

    if (benefitsRes.data) setBenefits(benefitsRes.data)

    if (rulesRes.data) {
      setRule(rulesRes.data)
      setRuleDays(rulesRes.data.available_days || [0, 1, 2, 3, 4, 5, 6])
      setRuleStart(rulesRes.data.available_hours_start || '00:00')
      setRuleEnd(rulesRes.data.available_hours_end || '23:59')
      setRuleLimit(rulesRes.data.daily_limit || 50)
      setRuleActive(rulesRes.data.is_active ?? true)
    }

    setLoading(false)
  }

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormCategory('prato')
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(benefit: Benefit) {
    setFormName(benefit.name)
    setFormDescription(benefit.description || '')
    setFormCategory(benefit.category)
    setEditingId(benefit.id)
    setShowForm(true)
  }

  async function handleSaveBenefit(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantId) return

    if (!formName.trim()) {
      setMessage({ type: 'error', text: 'Nome do beneficio e obrigatorio' })
      return
    }

    setSavingBenefit(true)
    setMessage(null)

    if (editingId) {
      // Update
      const { error } = await supabase
        .from('benefits')
        .update({
          name: formName.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
        })
        .eq('id', editingId)

      if (error) {
        setMessage({ type: 'error', text: `Erro ao atualizar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Beneficio atualizado!' })
        resetForm()
        await loadData()
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('benefits')
        .insert({
          restaurant_id: restaurantId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
        })

      if (error) {
        setMessage({ type: 'error', text: `Erro ao criar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Beneficio adicionado!' })
        resetForm()
        await loadData()
      }
    }

    setSavingBenefit(false)
  }

  async function toggleBenefit(id: string, currentActive: boolean) {
    const { error } = await supabase
      .from('benefits')
      .update({ is_active: !currentActive })
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: `Erro ao atualizar status: ${error.message}` })
      return
    }

    setBenefits((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: !currentActive } : b))
    )
  }

  async function deleteBenefit(id: string) {
    const { error } = await supabase.from('benefits').delete().eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: `Erro ao deletar: ${error.message}` })
    } else {
      setBenefits((prev) => prev.filter((b) => b.id !== id))
      setMessage({ type: 'success', text: 'Beneficio removido!' })
    }

    setDeletingId(null)
  }

  function toggleDay(day: number) {
    setRuleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  async function handleSaveRules() {
    if (!restaurantId) return

    setSavingRule(true)
    setMessage(null)

    if (ruleDays.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos 1 dia da semana' })
      setSavingRule(false)
      return
    }

    const ruleData = {
      restaurant_id: restaurantId,
      available_days: ruleDays,
      available_hours_start: ruleStart,
      available_hours_end: ruleEnd,
      daily_limit: ruleLimit,
      is_active: ruleActive,
    }

    if (rule) {
      const { error } = await supabase
        .from('benefit_rules')
        .update(ruleData)
        .eq('id', rule.id)

      if (error) {
        setMessage({ type: 'error', text: `Erro ao salvar regras: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Regras atualizadas!' })
      }
    } else {
      const { error } = await supabase
        .from('benefit_rules')
        .insert(ruleData)

      if (error) {
        setMessage({ type: 'error', text: `Erro ao criar regras: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Regras criadas!' })
        await loadData()
      }
    }

    setSavingRule(false)
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
          <h1 className="text-2xl font-bold text-neutral-900">Beneficios</h1>
          <p className="text-neutral-600">Configure os itens do +um para seus clientes</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            Adicionar Beneficio
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Paused Banner */}
      {rule && !rule.is_active && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Seus beneficios estao temporariamente pausados. Ative nas Regras de Disponibilidade abaixo.
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">
            {editingId ? 'Editar Beneficio' : 'Novo Beneficio'}
          </h2>

          <form onSubmit={handleSaveBenefit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Sobremesa do Dia"
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
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">Descricao</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Descricao do beneficio..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingBenefit}
                className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
              >
                {savingBenefit ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
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
          <p className="text-neutral-500">Nenhum beneficio cadastrado ainda.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Clique em &quot;Adicionar Beneficio&quot; para comecar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className={`rounded-lg border bg-white p-4 shadow-sm transition-opacity ${
                benefit.is_active ? 'border-neutral-200' : 'border-neutral-100 opacity-60'
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">{benefit.name}</h3>
                  {benefit.description && (
                    <p className="mt-1 text-sm text-neutral-500">{benefit.description}</p>
                  )}
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    CATEGORY_COLORS[benefit.category]
                  }`}
                >
                  {CATEGORIES.find((c) => c.value === benefit.category)?.label}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleBenefit(benefit.id, benefit.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    benefit.is_active ? 'bg-orange-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      benefit.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
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
                        Cancelar
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
          ))}
        </div>
      )}

      {/* Availability Rules */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">Regras de Disponibilidade</h2>

          {/* Global Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">
              {ruleActive ? 'Ativo' : 'Pausado'}
            </span>
            <button
              onClick={() => setRuleActive(!ruleActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ruleActive ? 'bg-orange-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ruleActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Days of week */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Dias da Semana
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    ruleDays.includes(day.value)
                      ? 'bg-orange-600 text-white'
                      : 'border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Horario Inicio
              </label>
              <input
                type="time"
                value={ruleStart}
                onChange={(e) => setRuleStart(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Horario Fim
              </label>
              <input
                type="time"
                value={ruleEnd}
                onChange={(e) => setRuleEnd(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Daily limit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Limite Diario de Cupons
            </label>
            <input
              type="number"
              value={ruleLimit}
              onChange={(e) => setRuleLimit(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={999}
              className="h-10 w-32 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Save rules */}
          <div className="flex justify-end border-t border-neutral-100 pt-4">
            <button
              onClick={handleSaveRules}
              disabled={savingRule}
              className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {savingRule ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
