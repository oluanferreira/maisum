'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface Metrics {
  coupons_validated: number
  unique_customers: number
  avg_rating: number
  total_reviews: number
  daily_coupons: { date: string; count: number }[] | null
}

interface TopBenefit {
  benefit_name: string
  category: string
  count: number
}

type Period = 7 | 30 | 90

const CATEGORY_COLORS: Record<string, string> = {
  prato: '#3B82F6',
  drink: '#8B5CF6',
  sobremesa: '#EC4899',
  combo: '#F97316',
}

const PIE_COLORS = ['#FF6B35', '#1B998B', '#FFCB47', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

const supabase = createClient()

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [topBenefits, setTopBenefits] = useState<TopBenefit[]>([])
  const [period, setPeriod] = useState<Period>(30)
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    loadRestaurantId()
  }, [])

  useEffect(() => {
    if (restaurantId) loadMetrics()
  }, [restaurantId, period])

  async function loadRestaurantId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('admin_user_id', user.id)
      .single()

    if (data) setRestaurantId(data.id)
  }

  async function loadMetrics() {
    if (!restaurantId) return
    setLoading(true)

    const { data, error } = await supabase.rpc('get_restaurant_metrics', {
      p_restaurant_id: restaurantId,
      p_days: period,
    })

    if (error) console.error('Erro ao carregar metricas:', error)
    else if (data) setMetrics(data as Metrics)

    // Top benefits
    const { data: benefits } = await supabase
      .from('coupons')
      .select('benefits(name, category)')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'used')
      .limit(100)

    if (benefits) {
      const benefitCount: Record<string, { name: string; category: string; count: number }> = {}
      for (const item of benefits) {
        const b = (item as unknown as { benefits: { name: string; category: string } | null }).benefits
        if (b) {
          const key = b.name
          if (!benefitCount[key]) benefitCount[key] = { name: b.name, category: b.category, count: 0 }
          benefitCount[key].count++
        }
      }
      const sorted = Object.values(benefitCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((b) => ({ benefit_name: b.name, category: b.category, count: b.count }))
      setTopBenefits(sorted)
    }

    setLoading(false)
  }

  const periods: { value: Period; label: string }[] = [
    { value: 7, label: '7 dias' },
    { value: 30, label: '30 dias' },
    { value: 90, label: '90 dias' },
  ]

  const metricCards = metrics
    ? [
        { title: 'Cupons Validados', value: metrics.coupons_validated, color: 'orange' },
        { title: 'Clientes Unicos', value: metrics.unique_customers, color: 'teal' },
        { title: 'Nota Media', value: metrics.avg_rating > 0 ? metrics.avg_rating.toFixed(1) : '—', color: 'yellow' },
        { title: 'Total Avaliacoes', value: metrics.total_reviews, color: 'blue' },
      ]
    : []

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  // Format daily_coupons for chart
  const dailyChartData = (metrics?.daily_coupons || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    cupons: d.count,
  }))

  // Format top benefits for pie chart
  const pieData = topBenefits.map((b) => ({
    name: b.benefit_name,
    value: b.count,
    category: b.category,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Metricas do seu restaurante</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            {/* Daily Coupons Bar Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Cupons por Dia</h2>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="cupons" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Cupons" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-neutral-400">
                  Nenhum dado no periodo selecionado
                </div>
              )}
            </div>

            {/* Top Benefits Pie Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">Beneficios Mais Resgatados</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }: { name?: string; percent?: number }) => {
                        const n = name || ''
                        const p = percent || 0
                        return `${n.length > 12 ? n.slice(0, 12) + '...' : n} ${(p * 100).toFixed(0)}%`
                      }}
                      labelLine={{ stroke: '#9CA3AF' }}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.category] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      formatter={(value) => [`${value}x`, 'Resgates']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-neutral-400">
                  Nenhum resgate registrado ainda
                </div>
              )}
            </div>
          </div>

          {/* Top Benefits List */}
          {topBenefits.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Ranking de Beneficios</h2>
              <div className="mt-4 space-y-3">
                {topBenefits.map((benefit, index) => (
                  <div key={benefit.benefit_name} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{benefit.benefit_name}</p>
                      <p className="text-xs text-neutral-500">{benefit.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">{benefit.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
