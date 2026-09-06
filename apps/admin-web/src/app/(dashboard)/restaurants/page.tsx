'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface City {
  id: string
  name: string
}

type PartnerStatus = 'pending' | 'approved' | 'rejected'

interface Restaurant {
  id: string
  name: string
  is_active: boolean
  partner_status: PartnerStatus
  created_at: string
  cities: { name: string } | null
}

const PAGE_SIZE = 20

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadCities()
    loadPendingCount()
  }, [])

  useEffect(() => {
    loadRestaurants()
  }, [search, cityFilter, statusFilter, page])

  async function loadCities() {
    const { data } = await supabase.from('cities').select('id, name').order('name')
    if (data) setCities(data)
  }

  async function loadPendingCount() {
    const { count } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('partner_status', 'pending')

    setPendingCount(count || 0)
  }

  async function loadRestaurants() {
    setLoading(true)

    let query = supabase
      .from('restaurants')
      .select('*, cities(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (cityFilter) {
      query = query.eq('city_id', cityFilter)
    }
    if (statusFilter === 'pending') {
      query = query.eq('partner_status', 'pending')
    } else if (statusFilter === 'active') {
      query = query.eq('partner_status', 'approved').eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('partner_status', 'approved').eq('is_active', false)
    } else if (statusFilter === 'rejected') {
      query = query.eq('partner_status', 'rejected')
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Erro ao carregar restaurantes:', error)
    } else {
      setRestaurants((data as Restaurant[]) || [])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }

  async function refreshAfterAction() {
    await Promise.all([loadRestaurants(), loadPendingCount()])
  }

  async function approvePartner(id: string) {
    setProcessingId(id)
    setActionError('')

    const { data, error } = await supabase.rpc('approve_partner_application', {
      p_restaurant_id: id,
    })

    if (error || !data || data.ok === false) {
      setActionError('Não foi possível aprovar o parceiro. Tente novamente.')
      setProcessingId(null)
      return
    }

    await refreshAfterAction()
    setProcessingId(null)
  }

  async function rejectPartner(id: string) {
    setProcessingId(id)
    setActionError('')

    const { data, error } = await supabase.rpc('reject_partner_application', {
      p_restaurant_id: id,
    })

    if (error || !data || data.ok === false) {
      setActionError('Não foi possível rejeitar o cadastro. Tente novamente.')
      setProcessingId(null)
      return
    }

    await refreshAfterAction()
    setProcessingId(null)
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    setProcessingId(id)
    setActionError('')

    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .eq('partner_status', 'approved')

    if (error) {
      setActionError('Não foi possível atualizar o status do restaurante.')
      setProcessingId(null)
      return
    }

    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !currentStatus } : r)),
    )
    setProcessingId(null)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function statusBadge(restaurant: Restaurant) {
    if (restaurant.partner_status === 'pending') {
      return { label: 'Pendente', className: 'bg-amber-100 text-amber-800' }
    }
    if (restaurant.partner_status === 'rejected') {
      return { label: 'Rejeitado', className: 'bg-red-100 text-red-700' }
    }
    if (restaurant.is_active) {
      return { label: 'Ativo', className: 'bg-green-100 text-green-700' }
    }
    return { label: 'Inativo', className: 'bg-neutral-100 text-neutral-500' }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">Restaurantes</h1>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pending')
                  setPage(0)
                }}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
              >
                {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
              </button>
            )}
          </div>
          <p className="text-neutral-600">Gerenciar restaurantes parceiros e aprovar novos cadastros</p>
        </div>
        <Link
          href="/restaurants/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
        >
          Novo Restaurante
        </Link>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="h-10 w-64 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />

        <select
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value)
            setPage(0)
          }}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Todas as cidades</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(0)
          }}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes de aprovação</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">Carregando...</td>
              </tr>
            ) : restaurants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">Nenhum restaurante encontrado</td>
              </tr>
            ) : (
              restaurants.map((restaurant) => {
                const badge = statusBadge(restaurant)
                const processing = processingId === restaurant.id
                const needsApproval = restaurant.partner_status === 'pending' || restaurant.partner_status === 'rejected'

                return (
                  <tr key={restaurant.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/restaurants/${restaurant.id}`}
                        className="text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        {restaurant.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{restaurant.cities?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(restaurant.created_at)}</td>
                    <td className="px-6 py-4 text-sm">
                      {needsApproval ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approvePartner(restaurant.id)}
                            disabled={processing}
                            className="rounded bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
                          >
                            {processing ? 'Processando...' : 'Aprovar'}
                          </button>
                          {restaurant.partner_status === 'pending' && (
                            <button
                              onClick={() => rejectPartner(restaurant.id)}
                              disabled={processing}
                              className="rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                            >
                              Rejeitar
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleStatus(restaurant.id, restaurant.is_active)}
                          disabled={processing}
                          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            restaurant.is_active
                              ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {restaurant.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de{' '}
            {totalCount} restaurantes
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-neutral-600">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
