'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface SocialProof {
  id: string
  proof_type: 'screenshot' | 'link'
  proof_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: { full_name: string | null } | null
  restaurants: { name: string } | null
}

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all'

export default function SocialProofsPage() {
  const [proofs, setProofs] = useState<SocialProof[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('pending')

  const supabase = createClient()

  useEffect(() => {
    loadProofs()
  }, [filter])

  async function loadProofs() {
    setLoading(true)

    let query = supabase
      .from('social_proofs')
      .select('*, profiles:user_id(full_name), restaurants:restaurant_id(name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar provas:', error)
    } else {
      setProofs((data as unknown as SocialProof[]) || [])
    }

    setLoading(false)
  }

  async function handleReview(proofId: string, newStatus: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('social_proofs')
      .update({ status: newStatus })
      .eq('id', proofId)

    if (error) {
      console.error('Erro ao atualizar prova:', error)
      return
    }

    setProofs((prev) => prev.filter((p) => p.id !== proofId))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: 'Pendentes' },
    { key: 'approved', label: 'Aprovadas' },
    { key: 'rejected', label: 'Rejeitadas' },
    { key: 'all', label: 'Todas' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Posts Sociais</h1>
        <p className="text-neutral-600">Validar provas de compartilhamento</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-orange-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Restaurante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Prova
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Status
              </th>
              {filter === 'pending' && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Acoes
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">
                  Carregando...
                </td>
              </tr>
            ) : proofs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhuma prova encontrada
                </td>
              </tr>
            ) : (
              proofs.map((proof) => (
                <tr key={proof.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {proof.profiles?.full_name || 'Usuario'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {proof.restaurants?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {proof.proof_type === 'screenshot' ? 'Screenshot' : 'Link'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <a
                      href={proof.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Ver prova
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {formatDate(proof.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        proof.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : proof.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {proof.status === 'approved'
                        ? 'Aprovada'
                        : proof.status === 'rejected'
                          ? 'Rejeitada'
                          : 'Pendente'}
                    </span>
                  </td>
                  {filter === 'pending' && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(proof.id, 'approved')}
                          className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReview(proof.id, 'rejected')}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
