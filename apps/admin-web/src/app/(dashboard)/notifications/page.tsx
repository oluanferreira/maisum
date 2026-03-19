'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/../lib/supabase/client'

// --- Types ---
interface City {
  id: string
  name: string
}

type Segment = 'all_users' | 'city' | 'active_subscribers'

// --- Page ---
export default function NotificationsPage() {
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [segment, setSegment] = useState<Segment>('all_users')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null)
  const [loadingReach, setLoadingReach] = useState(false)
  const [sending, setSending] = useState(false)

  // Fetch cities for dropdown
  useEffect(() => {
    const loadCities = async () => {
      const { data } = await supabase
        .from('cities')
        .select('id, name')
        .order('name')

      if (data) setCities(data as City[])
    }
    loadCities()
  }, [supabase])

  // Estimate reach based on segmentation
  const estimateReach = useCallback(async () => {
    setLoadingReach(true)

    try {
      if (segment === 'all_users') {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')

        setEstimatedReach(count || 0)
      } else if (segment === 'city' && selectedCityId) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .eq('city_id', selectedCityId)

        setEstimatedReach(count || 0)
      } else if (segment === 'active_subscribers') {
        const { count } = await supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')

        setEstimatedReach(count || 0)
      } else {
        setEstimatedReach(null)
      }
    } catch {
      setEstimatedReach(null)
    }

    setLoadingReach(false)
  }, [segment, selectedCityId, supabase])

  // Re-estimate when segment or city changes
  useEffect(() => {
    estimateReach()
  }, [estimateReach])

  // Send notification (placeholder)
  const handleSend = useCallback(() => {
    if (!title.trim() || !message.trim()) {
      alert('Preencha o titulo e a mensagem.')
      return
    }

    if (segment === 'city' && !selectedCityId) {
      alert('Selecione uma cidade.')
      return
    }

    const reachText = estimatedReach !== null ? estimatedReach : '?'
    const confirmed = confirm(
      `Enviar notificacao para ${reachText} usuario(s)?\n\nTitulo: ${title}\nMensagem: ${message}`
    )

    if (!confirmed) return

    setSending(true)

    // Placeholder: in production, this would call the send-push Edge Function
    // with the filtered user_ids based on segmentation
    alert(
      `Notificacao enviada com sucesso!\n\nSegmento: ${segment}\nAlcance estimado: ${reachText} usuario(s)\n\n(Placeholder — a integracao com a Edge Function send-push sera feita na implementacao completa.)`
    )

    // Reset form
    setTitle('')
    setMessage('')
    setSegment('all_users')
    setSelectedCityId('')
    setSending(false)
  }, [title, message, segment, selectedCityId, estimatedReach])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Push Notifications</h1>
        <p className="mt-1 text-neutral-600">
          Envie notificacoes segmentadas para os usuarios do app
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="notif-title" className="block text-sm font-medium text-neutral-700 mb-1">
            Titulo
          </label>
          <input
            id="notif-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Novo restaurante disponivel!"
            maxLength={50}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-400 mt-1">{title.length}/50 caracteres</p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="notif-message" className="block text-sm font-medium text-neutral-700 mb-1">
            Mensagem
          </label>
          <textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Confira os novos beneficios exclusivos na sua cidade!"
            maxLength={200}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-neutral-400 mt-1">{message.length}/200 caracteres</p>
        </div>

        {/* Segmentation */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">Segmentacao</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="segment"
                value="all_users"
                checked={segment === 'all_users'}
                onChange={() => setSegment('all_users')}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-neutral-700">Todos os usuarios</span>
            </label>

            <div className="flex items-start gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="segment"
                  value="city"
                  checked={segment === 'city'}
                  onChange={() => setSegment('city')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-neutral-700">Usuarios de:</span>
              </label>
              {segment === 'city' && (
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Selecione a cidade</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="segment"
                value="active_subscribers"
                checked={segment === 'active_subscribers'}
                onChange={() => setSegment('active_subscribers')}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-neutral-700">Assinantes ativos</span>
            </label>
          </div>
        </div>

        {/* Estimated reach */}
        <div className="bg-neutral-50 rounded-lg px-4 py-3">
          <p className="text-sm text-neutral-600">
            Alcance estimado:{' '}
            {loadingReach ? (
              <span className="text-neutral-400">calculando...</span>
            ) : estimatedReach !== null ? (
              <span className="font-bold text-neutral-900">{estimatedReach} usuario(s)</span>
            ) : (
              <span className="text-neutral-400">--</span>
            )}
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!title.trim() || !message.trim() || sending}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? 'Enviando...' : 'Enviar Agora'}
        </button>
      </div>

      {/* History placeholder */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Historico de Envios</h2>
        <div className="text-center py-8">
          <p className="text-neutral-400 text-sm">
            Nenhuma notificacao enviada ainda.
          </p>
          <p className="text-neutral-300 text-xs mt-1">
            O historico aparecera aqui apos o primeiro envio.
          </p>
        </div>
      </div>
    </div>
  )
}
