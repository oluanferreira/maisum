'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/../../lib/supabase/client'

// --- Types ---
interface ValidationResult {
  valid: boolean
  user_name?: string
  coupon_id?: string
  reason?: string
}

interface TodayValidation {
  id: string
  used_at: string
  profiles: { full_name: string | null } | null
}

// --- Page ---
export default function ValidatePage() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [todayValidations, setTodayValidations] = useState<TodayValidation[]>([])
  const [loading, setLoading] = useState(true)

  // Load restaurant ID for current admin and today's validations
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get restaurant for this admin
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('admin_user_id', user.id)
          .single()

        if (restaurant) {
          setRestaurantId(restaurant.id)
          await loadTodayValidations(restaurant.id)
        }
      } catch (err) {
        console.error('Error initializing:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load today's validations
  const loadTodayValidations = useCallback(async (restId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('coupons')
      .select('id, used_at, profiles:user_id(full_name)')
      .eq('restaurant_id', restId)
      .eq('status', 'used')
      .gte('used_at', today.toISOString())
      .order('used_at', { ascending: false })

    if (data) {
      setTodayValidations(data as unknown as TodayValidation[])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validate coupon
  const handleValidate = useCallback(async () => {
    if (!manualCode.trim() || !restaurantId) return

    setValidating(true)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_coupon_id: manualCode.trim(),
        p_restaurant_id: restaurantId,
      })

      if (error) {
        setResult({ valid: false, reason: error.message })
      } else {
        setResult(data as ValidationResult)
        // Refresh today's list on success
        if (data?.valid) {
          await loadTodayValidations(restaurantId)
        }
      }
    } catch (err) {
      setResult({ valid: false, reason: 'Erro ao validar cupom' })
    } finally {
      setValidating(false)
      // Auto-dismiss after 3 seconds
      setTimeout(() => setResult(null), 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCode, restaurantId, loadTodayValidations])

  // Format time from ISO string
  const formatTime = (isoStr: string): string => {
    const d = new Date(isoStr)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Validar Cupom</h1>

      {/* Camera placeholder */}
      <div className="bg-neutral-100 rounded-xl flex items-center justify-center h-64 mb-6 border-2 border-dashed border-neutral-300">
        <div className="text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-neutral-500 font-medium">Scanner QR</p>
          <p className="text-neutral-400 text-sm mt-1">Requer camera do dispositivo</p>
        </div>
      </div>

      {/* Manual input */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-6">
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          Ou digite o codigo:
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="ID do cupom (UUID)"
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleValidate}
            disabled={validating || !manualCode.trim() || !restaurantId}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px]"
          >
            {validating ? '...' : 'Validar'}
          </button>
        </div>
      </div>

      {/* Result overlay */}
      {result && (
        <div className={`rounded-xl p-8 mb-6 text-center animate-fade-in ${
          result.valid
            ? 'bg-green-50 border-2 border-green-400'
            : 'bg-red-50 border-2 border-red-400'
        }`}>
          <div className={`text-6xl font-bold mb-3 ${
            result.valid ? 'text-green-500' : 'text-red-500'
          }`}>
            {result.valid ? '✓' : '✗'}
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            result.valid ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.valid ? 'Cupom Validado!' : 'Cupom Invalido'}
          </h2>
          {result.valid && result.user_name && (
            <p className="text-green-600 font-medium">{result.user_name}</p>
          )}
          {!result.valid && result.reason && (
            <p className="text-red-600 text-sm mt-1">{result.reason}</p>
          )}
        </div>
      )}

      {/* Today's validations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Validados Hoje ({todayValidations.length})
        </h2>
        {todayValidations.length === 0 ? (
          <p className="text-neutral-400 text-sm">Nenhum cupom validado hoje</p>
        ) : (
          <ul className="space-y-3">
            {todayValidations.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                <span className="text-green-500 text-lg">✓</span>
                <span className="flex-1 text-neutral-800 font-medium text-sm">
                  {v.profiles?.full_name ?? 'Cliente'}
                </span>
                <span className="text-neutral-400 text-sm">
                  {v.used_at ? formatTime(v.used_at) : '--:--'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
