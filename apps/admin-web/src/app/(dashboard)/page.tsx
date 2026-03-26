'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface AdminMetrics {
  total_users: number
  active_subscribers: number
  mrr: number
  coupons_redeemed: number
  active_restaurants: number
  total_referrals: number
  referral_conversion: number
  churn_rate?: number
}

interface TopRestaurant {
  id: string
  name: string
  city_name: string
  coupons_count: number
}

interface City {
  id: string
  name: string
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadCities()
  }, [])

  useEffect(() => {
    loadMetrics()
  }, [cityFilter])

  async function loadCities() {
    const { data } = await supabase
      .from('cities')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (data) setCities(data)
  }

  async function loadMetrics() {
    setLoading(true)

    const { data, error } = await supabase.rpc('get_admin_metrics')

    if (error) {
      console.error('Erro ao carregar metricas:', error)
    } else if (data) {
      setMetrics(data as AdminMetrics)
    }

    // Top 5 restaurants
    let restQuery = supabase
      .from('restaurants')
      .select('id, name, cities(name)')
      .eq('is_active', true)
      .limit(5)

    if (cityFilter) {
      restQuery = restQuery.eq('city_id', cityFilter)
    }

    const { data: restaurants } = await restQuery

    if (restaurants && restaurants.length > 0) {
      const typedRestaurants = restaurants as unknown as { id: string; name: string; cities: { name: string } | null }[]
      const restIds = typedRestaurants.map((r) => r.id)

      // Fetch used coupons count per restaurant
      const { data: coupons } = await supabase
        .from('coupons')
        .select('restaurant_id')
        .in('restaurant_id', restIds)
        .eq('status', 'used')

      const countMap: Record<string, number> = {}
      coupons?.forEach((c) => {
        countMap[c.restaurant_id] = (countMap[c.restaurant_id] || 0) + 1
      })

      const mapped = typedRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        city_name: r.cities?.name || '—',
        coupons_count: countMap[r.id] || 0,
      }))

      // Sort by coupons_count descending
      mapped.sort((a, b) => b.coupons_count - a.coupons_count)

      setTopRestaurants(mapped)
    }

    setLoading(false)
  }

  function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`
  }

  const metricCards = metrics
    ? [
        { title: 'Total Usuarios', value: metrics.total_users.toLocaleString('pt-BR'), color: 'blue' },
        { title: 'Assinantes Ativos', value: metrics.active_subscribers.toLocaleString('pt-BR'), color: 'green' },
        { title: 'MRR', value: formatCurrency(metrics.mrr), color: 'emerald' },
        { title: 'Cupons Resgatados', value: metrics.coupons_redeemed.toLocaleString('pt-BR'), color: 'orange' },
        { title: 'Restaurantes Ativos', value: metrics.active_restaurants.toLocaleString('pt-BR'), color: 'purple' },
        {
          title: 'Churn Rate',
          value: metrics.churn_rate !== undefined ? formatPercent(metrics.churn_rate) : '—',
          color: 'red',
        },
      ]
    : []

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Metricas gerais da plataforma +um</p>
        </div>

        {/* City Filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500">Carregando metricas...</div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {metricCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-xl border p-6 ${colorMap[card.color] || 'bg-neutral-50 border-neutral-200'}`}
              >
                <p className="text-sm font-medium opacity-80">{card.title}</p>
                <p className="mt-2 text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Placeholder */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Crescimento de Assinantes</h2>
              <div className="mt-4 flex h-48 items-center justify-center text-sm text-neutral-400">
                Grafico disponivel com Recharts
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Cupons Resgatados / Dia</h2>
              <div className="mt-4 flex h-48 items-center justify-center text-sm text-neutral-400">
                Grafico disponivel com Recharts
              </div>
            </div>
          </div>

          {/* Referral Stats */}
          {metrics && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Indicacoes</h2>
              <div className="mt-4 flex gap-8">
                <div>
                  <p className="text-sm text-neutral-500">Total de indicacoes</p>
                  <p className="text-2xl font-bold text-neutral-900">{metrics.total_referrals}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Taxa de conversao</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatPercent(metrics.referral_conversion)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top 5 Restaurants */}
          {topRestaurants.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Top 5 Restaurantes</h2>
              <table className="mt-4 w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">
                      #
                    </th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">
                      Nome
                    </th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">
                      Cidade
                    </th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-neutral-500">
                      Cupons
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {topRestaurants.map((restaurant, index) => (
                    <tr key={restaurant.id}>
                      <td className="py-3 text-sm font-bold text-orange-600">{index + 1}</td>
                      <td className="py-3 text-sm font-medium text-neutral-900">
                        {restaurant.name}
                      </td>
                      <td className="py-3 text-sm text-neutral-600">{restaurant.city_name}</td>
                      <td className="py-3 text-right text-sm font-semibold text-neutral-900">{restaurant.coupons_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
