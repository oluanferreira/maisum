'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface Restaurant {
  id: string
  name: string
}

interface Invite {
  id: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
  restaurants: { name: string } | null
}

export default function InvitePage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [invitesRes, restaurantsRes] = await Promise.all([
      supabase
        .from('restaurant_invites')
        .select('*, restaurants(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('restaurants')
        .select('id, name')
        .order('name'),
    ])

    if (invitesRes.data) setInvites(invitesRes.data as Invite[])
    if (restaurantsRes.data) setRestaurants(restaurantsRes.data)

    setLoading(false)
  }

  async function generateInvite() {
    if (!selectedRestaurant) {
      setError('Selecione um restaurante')
      return
    }

    setGenerating(true)
    setError('')
    setGeneratedLink('')

    const { data, error: insertError } = await supabase
      .from('restaurant_invites')
      .insert({ restaurant_id: selectedRestaurant })
      .select('token')
      .single()

    if (insertError) {
      setError(`Erro ao gerar convite: ${insertError.message}`)
      setGenerating(false)
      return
    }

    const link = `${window.location.origin}/register?token=${data.token}`
    setGeneratedLink(link)
    setGenerating(false)
    setCopied(false)

    await loadData()
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Erro ao copiar link')
    }
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

  function getStatus(invite: Invite) {
    if (invite.used_at) return { label: 'Usado', className: 'bg-neutral-100 text-neutral-500' }
    if (new Date(invite.expires_at) < new Date()) return { label: 'Expirado', className: 'bg-red-100 text-red-700' }
    return { label: 'Pendente', className: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Links de Convite</h1>
        <p className="text-neutral-600">Gere links para restaurantes se cadastrarem na plataforma</p>
      </div>

      {/* Generate Section */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">Gerar Novo Link</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1" style={{ minWidth: 200 }}>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Restaurante
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Selecione um restaurante...</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateInvite}
            disabled={generating || !selectedRestaurant}
            className="h-10 rounded-lg bg-orange-600 px-6 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? 'Gerando...' : 'Gerar Novo Link'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        {generatedLink && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-sm font-medium text-green-800">Link gerado com sucesso!</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-neutral-700"
              />
              <button
                onClick={copyToClipboard}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invites Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Restaurante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Expira em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Criado em
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
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhum convite gerado ainda
                </td>
              </tr>
            ) : (
              invites.map((invite) => {
                const status = getStatus(invite)
                return (
                  <tr key={invite.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      {invite.restaurants?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
                        {invite.token.slice(0, 12)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDate(invite.expires_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDate(invite.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
