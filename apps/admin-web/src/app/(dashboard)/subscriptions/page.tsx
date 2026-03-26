'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface Subscription {
  id: string
  plan_type: string
  status: string
  current_period_end: string
  profiles: { full_name: string } | null
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-neutral-100 text-neutral-700',
}

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  past_due: 'Vencido',
  pending: 'Pendente',
}

const planLabel: Record<string, string> = {
  basic: 'Basico',
  premium: 'Premium',
  family: 'Familia',
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    setLoading(true)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status, current_period_end, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } else {
      setSubscriptions(
        (data || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          plan_type: d.plan_type as string,
          status: d.status as string,
          current_period_end: d.current_period_end as string,
          profiles: d.profiles as { full_name: string } | null,
        }))
      )
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Assinaturas</h1>
        <p className="text-neutral-600">Gerenciar planos e pagamentos</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500">Carregando assinaturas...</div>
      ) : subscriptions.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">Nenhuma assinatura encontrada</div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {sub.profiles?.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {planLabel[sub.plan_type] || sub.plan_type}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[sub.status] || 'bg-neutral-100 text-neutral-700'}`}
                    >
                      {statusLabel[sub.status] || sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
