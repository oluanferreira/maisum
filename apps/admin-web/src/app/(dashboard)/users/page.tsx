'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  role: string
  created_at: string
}

interface Subscription {
  id: string
  plan_type: string
  status: string
  current_period_start: string
  current_period_end: string
  provider_subscription_id: string | null
  access_source: string | null
}

interface Coupon {
  id: string
  status: string
  source: string
  expires_at: string
  created_at: string
}

const roleBadge: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  restaurant_admin: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

const roleLabel: Record<string, string> = {
  user: 'Usuario',
  restaurant_admin: 'Admin Rest.',
  super_admin: 'Super Admin',
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [couponQuantity, setCouponQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
  }, [roleFilter])

  async function loadProfiles() {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar usuarios:', error)
    } else {
      setProfiles(data || [])
    }

    setLoading(false)
  }

  async function openUser(profile: Profile, preserveNotice = false) {
    setSelectedProfile(profile)
    setSubscriptions([])
    setCoupons([])
    if (!preserveNotice) setNotice('')
    setDetailLoading(true)

    const [subscriptionsResult, couponsResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, plan_type, status, current_period_start, current_period_end, provider_subscription_id, access_source')
        .eq('user_id', profile.id)
        .order('current_period_end', { ascending: false }),
      supabase
        .from('coupons')
        .select('id, status, source, expires_at, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    if (subscriptionsResult.error || couponsResult.error) {
      setNotice('Não foi possível carregar todos os dados do usuário.')
    }
    setSubscriptions((subscriptionsResult.data || []) as Subscription[])
    setCoupons((couponsResult.data || []) as Coupon[])
    setDetailLoading(false)
  }

  async function activateAnnual() {
    if (!selectedProfile) return
    setActionLoading('annual')
    setNotice('')

    const manualId = `manual-admin:${selectedProfile.id}`
    const now = new Date()
    const oneYearFromNow = new Date(now)
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    const existing = subscriptions.find((subscription) => subscription.provider_subscription_id === manualId)

    const payload = {
      user_id: selectedProfile.id,
      plan_type: 'annual',
      status: 'active',
      provider: 'manual_admin',
      access_source: 'admin_grant',
      provider_subscription_id: manualId,
      abacatepay_subscription_id: manualId,
      current_period_start: now.toISOString(),
      current_period_end: oneYearFromNow.toISOString(),
    }

    const result = existing
      ? await supabase.from('subscriptions').update(payload).eq('id', existing.id)
      : await supabase.from('subscriptions').insert(payload)

    if (result.error) {
      setNotice(`Não foi possível ativar o anual: ${result.error.message}`)
    } else {
      setNotice('Plano anual ativado por 12 meses.')
      await openUser(selectedProfile, true)
    }
    setActionLoading(null)
  }

  async function addAdminCoupons() {
    if (!selectedProfile) return
    const quantity = Math.max(1, Math.min(50, Number(couponQuantity) || 1))
    setActionLoading('add-coupons')
    setNotice('')

    const activeSubscription = subscriptions.find((subscription) => subscription.status === 'active')
    const expiresAt = activeSubscription?.current_period_end ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const payload = Array.from({ length: quantity }, () => ({
      user_id: selectedProfile.id,
      subscription_id: activeSubscription?.id ?? null,
      status: 'available',
      source: 'admin',
      expires_at: expiresAt,
    }))
    const { error } = await supabase.from('coupons').insert(payload)

    if (error) {
      setNotice(`Não foi possível adicionar os cupons: ${error.message}`)
    } else {
      setNotice(`${quantity} cupom${quantity > 1 ? 's' : ''} avulso${quantity > 1 ? 's foram adicionados' : ' foi adicionado'}.`)
      await openUser(selectedProfile, true)
    }
    setActionLoading(null)
  }

  async function removeAdminCoupons() {
    if (!selectedProfile) return
    const quantity = Math.max(1, Math.min(50, Number(couponQuantity) || 1))
    const candidates = coupons
      .filter((coupon) => coupon.status === 'available' && coupon.source === 'admin')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, quantity)

    if (candidates.length === 0) {
      setNotice('Este usuário não tem cupons avulsos administrativos disponíveis para remover.')
      return
    }

    setActionLoading('remove-coupons')
    setNotice('')
    const { error } = await supabase
      .from('coupons')
      .update({ status: 'expired' })
      .in('id', candidates.map((coupon) => coupon.id))

    if (error) {
      setNotice(`Não foi possível remover os cupons: ${error.message}`)
    } else {
      setNotice(`${candidates.length} cupom${candidates.length > 1 ? 's avulsos foram removidos' : ' avulso foi removido'}.`)
      await openUser(selectedProfile, true)
    }
    setActionLoading(null)
  }

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name?.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
  )
  const availableCoupons = coupons.filter((coupon) => coupon.status === 'available').length
  const adminCoupons = coupons.filter((coupon) => coupon.status === 'available' && coupon.source === 'admin').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Usuários</h1>
          <p className="text-neutral-600">Abra um usuário para liberar anual e administrar cupons avulsos.</p>
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome"
            className="h-10 w-48 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Todos os perfis</option>
            <option value="user">Usuário</option>
            <option value="restaurant_admin">Admin de estabelecimento</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500">Carregando usuários...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">Nenhum usuário encontrado</div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Criado em</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-neutral-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {profile.full_name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[profile.role] || 'bg-neutral-100 text-neutral-700'}`}
                    >
                      {roleLabel[profile.role] || profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openUser(profile)}
                      className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedProfile && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{selectedProfile.full_name || 'Usuário sem nome'}</h2>
              <p className="mt-1 text-sm text-neutral-500">ID: {selectedProfile.id}</p>
            </div>
            <button onClick={() => setSelectedProfile(null)} className="text-sm font-medium text-neutral-500 hover:text-neutral-900">Fechar</button>
          </div>

          {detailLoading ? (
            <div className="py-8 text-sm text-neutral-500">Carregando dados administrativos...</div>
          ) : (
            <div className="mt-6 space-y-6">
              {notice && <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-800">{notice}</div>}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-neutral-50 p-4"><p className="text-xs uppercase text-neutral-500">Assinaturas</p><p className="mt-1 text-2xl font-bold">{subscriptions.length}</p></div>
                <div className="rounded-lg bg-neutral-50 p-4"><p className="text-xs uppercase text-neutral-500">Cupons disponíveis</p><p className="mt-1 text-2xl font-bold">{availableCoupons}</p></div>
                <div className="rounded-lg bg-neutral-50 p-4"><p className="text-xs uppercase text-neutral-500">Avulsos administrativos</p><p className="mt-1 text-2xl font-bold">{adminCoupons}</p></div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900">Plano anual</h3>
                    <p className="text-sm text-neutral-600">Libera acesso anual manual por 12 meses, sem alterar pagamentos ou assinatura Cakto.</p>
                  </div>
                  <button onClick={activateAnnual} disabled={actionLoading !== null} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                    {actionLoading === 'annual' ? 'Ativando...' : 'Ativar anual'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Cupons avulsos</h3>
                <p className="mt-1 text-sm text-neutral-600">Os cupons adicionados ficam identificados como administrativos; remover cancela somente esses cupons, sem tocar nos cupons de compra.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input type="number" min="1" max="50" value={couponQuantity} onChange={(e) => setCouponQuantity(Number(e.target.value))} className="h-10 w-24 rounded-lg border border-neutral-300 px-3 text-sm" />
                  <button onClick={addAdminCoupons} disabled={actionLoading !== null} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50">
                    {actionLoading === 'add-coupons' ? 'Adicionando...' : 'Adicionar cupons'}
                  </button>
                  <button onClick={removeAdminCoupons} disabled={actionLoading !== null} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    {actionLoading === 'remove-coupons' ? 'Removendo...' : 'Remover avulsos'}
                  </button>
                </div>
              </div>

              {subscriptions.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-neutral-900">Histórico de assinaturas</h3>
                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="flex flex-wrap justify-between gap-2 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0">
                        <span className="font-medium text-neutral-900">{subscription.plan_type} · {subscription.status}</span>
                        <span className="text-neutral-600">até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')} {subscription.access_source ? `· ${subscription.access_source}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
