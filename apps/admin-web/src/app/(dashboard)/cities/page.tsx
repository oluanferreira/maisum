'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

interface City {
  id: string
  name: string
  state: string
  is_active: boolean
  created_at: string
  restaurant_count: number
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formState, setFormState] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    setLoading(true)

    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state, is_active, created_at')
      .order('name')

    if (error) {
      console.error('Erro ao carregar cidades:', error)
      setLoading(false)
      return
    }

    // Count restaurants per city
    const citiesWithCount: City[] = []
    for (const city of data || []) {
      const { count } = await supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)

      citiesWithCount.push({
        ...city,
        restaurant_count: count || 0,
      })
    }

    setCities(citiesWithCount)
    setLoading(false)
  }

  async function handleCreateCity() {
    if (!formName.trim()) {
      setFormError('Nome da cidade e obrigatorio.')
      return
    }
    if (!formState) {
      setFormError('Selecione o estado.')
      return
    }

    setSaving(true)
    setFormError('')

    const { error } = await supabase.from('cities').insert({
      name: formName.trim(),
      state: formState,
      is_active: true,
    })

    if (error) {
      if (error.code === '23505') {
        setFormError('Esta cidade ja existe.')
      } else {
        setFormError('Erro ao criar cidade. Tente novamente.')
      }
      setSaving(false)
      return
    }

    setFormName('')
    setFormState('')
    setShowForm(false)
    setSaving(false)
    loadCities()
  }

  async function toggleCityStatus(cityId: string, currentStatus: boolean) {
    if (currentStatus) {
      const confirmed = window.confirm(
        'Restaurantes desta cidade nao aparecerao no app. Continuar?'
      )
      if (!confirmed) return
    }

    const { error } = await supabase
      .from('cities')
      .update({ is_active: !currentStatus })
      .eq('id', cityId)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return
    }

    setCities((prev) =>
      prev.map((c) => (c.id === cityId ? { ...c, is_active: !currentStatus } : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cidades</h1>
          <p className="text-neutral-600">Gerenciar cidades e regioes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
        >
          {showForm ? 'Cancelar' : 'Nova Cidade'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Adicionar Cidade</h2>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Nome da cidade
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Jequie"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Estado
              </label>
              <select
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">UF</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateCity}
              disabled={saving}
              className="h-10 rounded-lg bg-orange-600 px-6 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
          {formError && (
            <p className="mt-2 text-sm text-red-600">{formError}</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Restaurantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                  Carregando...
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhuma cidade cadastrada
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr key={city.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {city.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{city.state}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {city.restaurant_count}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        city.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {city.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleCityStatus(city.id, city.is_active)}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        city.is_active
                          ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {city.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
