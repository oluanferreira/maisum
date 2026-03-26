'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string | null } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('admin_user_id', user.id)
      .single()

    if (!restaurant) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar avaliacoes:', error)
    } else if (data) {
      setReviews(data as Review[])
    }

    setLoading(false)
  }

  function renderStars(rating: number) {
    return (
      <span style={{ color: '#F59E0B' }}>
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-500">Carregando avaliacoes...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Avaliacoes</h1>
        <p className="mt-1 text-neutral-600">Avaliacoes dos clientes sobre seu restaurante</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">Nenhuma avaliacao ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 font-medium text-neutral-700">Cliente</th>
                <th className="px-6 py-3 font-medium text-neutral-700">Nota</th>
                <th className="px-6 py-3 font-medium text-neutral-700">Comentario</th>
                <th className="px-6 py-3 font-medium text-neutral-700">Data</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {review.profiles?.full_name || 'Cliente'}
                  </td>
                  <td className="px-6 py-4">{renderStars(review.rating)}</td>
                  <td className="px-6 py-4 text-neutral-600">
                    {review.comment || '—'}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
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
