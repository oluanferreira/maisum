'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

interface City { id: string; name: string }
interface DailyPoint { date: string; value: number }

const supabase = createClient()

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [subscriberGrowth, setSubscriberGrowth] = useState<DailyPoint[]>([])
  const [dailyCoupons, setDailyCoupons] = useState<DailyPoint[]>([])

  useEffect(() => { void loadCities() }, [])
  useEffect(() => { void loadMetrics() }, [cityFilter])

  async function loadCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name')
    if (data) setCities(data)
  }

  async function loadMetrics() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_admin_metrics')
    if (error) console.error('Erro ao carregar metricas:', error)
    else if (data) setMetrics(data as AdminMetrics)

    let restQuery = supabase.from('restaurants').select('id, name, cities(name)').eq('is_active', true).limit(5)
    if (cityFilter) restQuery = restQuery.eq('city_id', cityFilter)
    const { data: restaurants } = await restQuery

    if (restaurants && restaurants.length > 0) {
      const typedRestaurants = restaurants as unknown as { id: string; name: string; cities: { name: string } | null }[]
      const restIds = typedRestaurants.map((r) => r.id)
      const { data: coupons } = await supabase.from('coupons').select('restaurant_id').in('restaurant_id', restIds).eq('status', 'used')
      const countMap: Record<string, number> = {}
      coupons?.forEach((c) => { countMap[c.restaurant_id] = (countMap[c.restaurant_id] || 0) + 1 })
      setTopRestaurants(typedRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        city_name: r.cities?.name || '—',
        coupons_count: countMap[r.id] || 0,
      })).sort((a, b) => b.coupons_count - a.coupons_count))
    } else setTopRestaurants([])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: subs } = await supabase.from('subscriptions').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at')
    if (subs) {
      const dayMap: Record<string, number> = {}
      for (const s of subs) {
        const day = new Date(s.created_at).toISOString().split('T')[0]
        dayMap[day] = (dayMap[day] || 0) + 1
      }
      const growth: DailyPoint[] = []
      let cumulative = 0
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().split('T')[0]
        cumulative += dayMap[key] || 0
        growth.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: cumulative })
      }
      setSubscriberGrowth(growth)
    }

    const { data: usedCoupons } = await supabase.from('coupons').select('used_at').eq('status', 'used').not('used_at', 'is', null).gte('used_at', thirtyDaysAgo.toISOString()).order('used_at')
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
        daily.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: dayMap[key] || 0 })
      }
      setDailyCoupons(daily)
    }
    setLoading(false)
  }

  function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  function formatPercent(value: number) { return `${(value * 100).toFixed(1)}%` }

  const metricCards = metrics ? [
    { title: 'Usuários', value: metrics.total_users.toLocaleString('pt-BR'), helper: 'base total' },
    { title: 'Passaportes ativos', value: metrics.active_subscribers.toLocaleString('pt-BR'), helper: 'acesso ativo' },
    { title: 'MRR', value: formatCurrency(metrics.mrr), helper: 'receita recorrente' },
    { title: '+UM usados', value: metrics.coupons_redeemed.toLocaleString('pt-BR'), helper: 'experiências' },
    { title: 'Parceiros ativos', value: metrics.active_restaurants.toLocaleString('pt-BR'), helper: 'na plataforma' },
    { title: 'Conversão indicação', value: formatPercent(metrics.referral_conversion), helper: 'convites convertidos' },
  ] : []

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff8f72]">Visão geral</p>
          <h1 className="font-display mt-1 text-4xl leading-none text-[#f5edde] sm:text-5xl">Operação +UM</h1>
          <p className="mt-2 max-w-xl text-sm text-[#8e8268]">O que está acontecendo na plataforma, sem ruído.</p>
        </div>
        <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8e8268] sm:min-w-48">
          Cidade
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm text-[#f5edde] outline-none">
            <option value="">Todas as cidades</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>
      </header>

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-[1.75rem] border border-white/8 bg-white/[0.025]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a59]" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {metricCards.map((card, index) => (
              <div key={card.title} className={`min-w-0 rounded-[1.4rem] border p-3.5 sm:p-4 ${index === 2 ? 'border-[#ff7a59]/25 bg-[#ff7a59]/10' : 'border-white/8 bg-white/[0.03]'}`}>
                <p className="text-[11px] font-medium text-[#8e8268]">{card.title}</p>
                <p className={`mt-2 break-words text-xl font-bold tracking-tight sm:text-2xl ${index === 2 ? 'text-[#ff9a80]' : 'text-[#f5edde]'}`}>{card.value}</p>
                <p className="mt-1 text-[10px] text-[#6f654f]">{card.helper}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="Crescimento de Passaportes" helper="Últimos 30 dias · acumulado">
              {subscriberGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={subscriberGrowth} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientSubs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8e8268' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#8e8268' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: '#261f15', color: '#f5edde', fontSize: 12 }} labelStyle={{ color: '#b8ab94' }} formatter={(value) => [String(value), 'Passaportes']} />
                    <Area type="monotone" dataKey="value" stroke="#FF7A59" fill="url(#gradientSubs)" strokeWidth={2.5} name="Passaportes" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Experiências por dia" helper="Últimos 30 dias">
              {dailyCoupons.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyCoupons} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8e8268' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#8e8268' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: '#261f15', color: '#f5edde', fontSize: 12 }} labelStyle={{ color: '#b8ab94' }} formatter={(value) => [String(value), 'Experiências']} />
                    <Bar dataKey="value" fill="#F5D272" radius={[6, 6, 2, 2]} name="Experiências" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </section>

          {metrics ? (
            <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8e8268]">Indicações</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#f5edde]">Crescimento por convite</h2>
                </div>
                <span className="rounded-full border border-[#f5d272]/20 bg-[#f5d272]/10 px-3 py-1 text-xs font-semibold text-[#f5d272]">{formatPercent(metrics.referral_conversion)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <MiniStat label="Total de indicações" value={metrics.total_referrals.toLocaleString('pt-BR')} />
                <MiniStat label="Taxa de conversão" value={formatPercent(metrics.referral_conversion)} />
              </div>
            </section>
          ) : null}

          {topRestaurants.length > 0 ? (
            <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8e8268]">Parceiros</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#f5edde]">Mais usados</h2>
                </div>
                <span className="text-xs text-[#6f654f]">Top 5</span>
              </div>

              <div className="mt-4 grid gap-2 md:hidden">
                {topRestaurants.map((restaurant, index) => (
                  <div key={restaurant.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ff7a59]/10 text-sm font-bold text-[#ff8f72]">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#f5edde]">{restaurant.name}</p>
                      <p className="text-xs text-[#8e8268]">{restaurant.city_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#f5edde]">{restaurant.coupons_count}</p>
                      <p className="text-[10px] text-[#6f654f]">usos</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px]">
                  <thead><tr className="border-b border-white/8 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8e8268]"><th className="pb-3">#</th><th className="pb-3">Parceiro</th><th className="pb-3">Cidade</th><th className="pb-3 text-right">Usos</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {topRestaurants.map((restaurant, index) => (
                      <tr key={restaurant.id}><td className="py-3 text-sm font-bold text-[#ff8f72]">{index + 1}</td><td className="py-3 text-sm font-semibold text-[#f5edde]">{restaurant.name}</td><td className="py-3 text-sm text-[#8e8268]">{restaurant.city_name}</td><td className="py-3 text-right text-sm font-bold text-[#f5edde]">{restaurant.coupons_count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

function ChartCard({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return <div className="min-w-0 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5"><h2 className="text-base font-semibold text-[#f5edde]">{title}</h2><p className="mb-3 mt-0.5 text-[11px] text-[#8e8268]">{helper}</p>{children}</div>
}
function EmptyChart() { return <div className="grid h-[220px] place-items-center text-sm text-[#8e8268]">Ainda sem dados suficientes</div> }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3"><p className="text-[11px] text-[#8e8268]">{label}</p><p className="mt-1 text-xl font-bold text-[#f5edde]">{value}</p></div> }
