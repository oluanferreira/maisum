'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AdminMetrics {
  total_users: number
  active_subscribers: number
  mrr: number
  coupons_redeemed: number
  active_restaurants: number
  total_referrals: number
  referral_conversion: number
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

interface DailyPoint {
  date: string
  value: number
}

const supabase = createClient()

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [subscriberGrowth, setSubscriberGrowth] = useState<DailyPoint[]>([])
  const [dailyCoupons, setDailyCoupons] = useState<DailyPoint[]>([])

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
    if (error) console.error('Erro ao carregar metricas:', error)
    else if (data) setMetrics(data as AdminMetrics)

    // Top 5 restaurants
    let restQuery = supabase
      .from('restaurants')
      .select('id, name, cities(name)')
      .eq('is_active', true)
      .limit(5)

    if (cityFilter) restQuery = restQuery.eq('city_id', cityFilter)

    const { data: restaurants } = await restQuery

    if (restaurants && restaurants.length > 0) {
      const typedRestaurants = restaurants as unknown as { id: string; name: string; cities: { name: string } | null }[]
      const restIds = typedRestaurants.map((r) => r.id)

      const { data: coupons } = await supabase
        .from('coupons')
        .select('restaurant_id')
        .in('restaurant_id', restIds)
        .eq('status', 'used')

      const countMap: Record<string, number> = {}
      coupons?.forEach((c) => {
        countMap[c.restaurant_id] = (countMap[c.restaurant_id] || 0) + 1
      })

      const mapped = typedRestaurants
        .map((r) => ({
          id: r.id,
          name: r.name,
          city_name: r.cities?.name || '—',
          coupons_count: countMap[r.id] || 0,
        }))
        .sort((a, b) => b.coupons_count - a.coupons_count)

      setTopRestaurants(mapped)
    }

    // Subscriber growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at')

    if (subs) {
      const dayMap: Record<string, number> = {}
      for (const s of subs) {
        const day = new Date(s.created_at).toISOString().split('T')[0]
        dayMap[day] = (dayMap[day] || 0) + 1
      }

      // Fill gaps
      const growth: DailyPoint[] = []
      let cumulative = 0
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().split('T')[0]
        cumulative += dayMap[key] || 0
        growth.push({
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: cumulative,
        })
      }
      setSubscriberGrowth(growth)
    }

    // Daily coupons redeemed (last 30 days)
    const { data: usedCoupons } = await supabase
      .from('coupons')
      .select('used_at')
      .eq('status', 'used')
      .not('used_at', 'is', null)
      .gte('used_at', thirtyDaysAgo.toISOString())
      .order('used_at')

    if (usedCoupons) {
      const dayMap: Record<string, number> = {}
      for (const c of usedCoupons) {
        if (c.used_at) {
          const day = new Date(c.used_at).toISOString().split('T')[0]
          dayMap[day] = (dayMap[day] || 0) + 1
        }
      }

      const daily: DailyPoint[] = []
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().split('T')[0]
        daily.push({
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: dayMap[key] || 0,
        })
      }
      setDailyCoupons(daily)
    }

    setLoading(false)
  }

  function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
        { title: 'Conversao Indicacoes', value: formatPercent(metrics.referral_conversion), color: 'teal' },
      ]
    : []

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Metricas gerais da plataforma +um</p>
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        </div>
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

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subscriber Growth — Area Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Crescimento de Assinantes</h2>
              <p className="mb-2 text-xs text-neutral-400">Ultimos 30 dias (acumulado)</p>
              {subscriberGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={subscriberGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradientSubs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B998B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1B998B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value: number) => [value, 'Assinantes']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#1B998B" fill="url(#gradientSubs)" strokeWidth={2} name="Assinantes" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[240px] items-center justify-center text-sm text-neutral-400">
                  Nenhum dado disponivel
                </div>
              )}
            </div>

            {/* Daily Coupons — Bar Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Cupons Resgatados / Dia</h2>
              <p className="mb-2 text-xs text-neutral-400">Ultimos 30 dias</p>
              {dailyCoupons.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dailyCoupons} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value: number) => [value, 'Cupons']}
                    />
                    <Bar dataKey="value" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Cupons" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[240px] items-center justify-center text-sm text-neutral-400">
                  Nenhum dado disponivel
                </div>
              )}
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
                  <p className="text-2xl font-bold text-neutral-900">{formatPercent(metrics.referral_conversion)}</p>
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
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">#</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">Nome</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-neutral-500">Cidade</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-neutral-500">Cupons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {topRestaurants.map((restaurant, index) => (
                    <tr key={restaurant.id}>
                      <td className="py-3 text-sm font-bold text-orange-600">{index + 1}</td>
                      <td className="py-3 text-sm font-medium text-neutral-900">{restaurant.name}</td>
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
