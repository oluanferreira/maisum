'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/../lib/supabase/client'
import { trackRestaurantEvent } from '@/lib/analytics'

// --- Types ---
interface ValidationResult {
  valid: boolean
  user_name?: string
  coupon_id?: string
  reason?: string
}

interface UsageHistoryItem {
  id: string
  used_at: string
  short_code: string | null
  profiles: { full_name: string | null } | null
}

const COUPON_CODE_PATTERN = /^[A-Z0-9]{6}$/

function normalizeCouponCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

// --- Page ---
export default function ValidatePage() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load restaurant ID for current admin and recent usage history
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
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (restaurant) {
          setRestaurantId(restaurant.id)
          await loadUsageHistory(restaurant.id)
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

  // Load usage history
  const loadUsageHistory = useCallback(async (restId: string) => {
    const { data } = await supabase
      .from('coupons')
      .select('id, used_at, short_code, profiles:user_id(full_name)')
      .eq('restaurant_id', restId)
      .eq('status', 'used')
      .order('used_at', { ascending: false })
      .limit(20)

    if (data) {
      setUsageHistory(data as unknown as UsageHistoryItem[])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validate coupon
  const handleValidate = useCallback(async () => {
    const couponCode = normalizeCouponCode(manualCode)
    if (!couponCode || !restaurantId) return

    if (!COUPON_CODE_PATTERN.test(couponCode)) {
      setResult({ valid: false, reason: 'Codigo deve ter 6 letras ou numeros' })
      return
    }

    setValidating(true)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('validate_coupon_by_code', {
        p_short_code: couponCode,
        p_restaurant_id: restaurantId,
      })

      if (error) {
        console.error('Error validating coupon:', error)
        setResult({ valid: false, reason: 'Nao foi possivel validar agora. Tente novamente.' })
      } else {
        setResult(data as ValidationResult)
        // Refresh today's list on success
        if (data?.valid) {
          await trackRestaurantEvent(supabase, {
            eventName: 'experience_validated',
            pathname: '/validate',
            restaurantId,
            couponId: data.coupon_id ?? couponCode,
            metadata: { inputMode: 'manual' },
          })
          await loadUsageHistory(restaurantId)
        }
      }
    } catch (err) {
      console.error('Unexpected coupon validation failure:', err)
      setResult({ valid: false, reason: 'Erro ao validar cupom' })
    } finally {
      setValidating(false)
      // Keep the result visible long enough for counter attendants to confirm it.
      setTimeout(() => setResult(null), 8000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCode, restaurantId, loadUsageHistory])

  const formatDateTime = (isoStr: string): string => {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-orange-600">Operacao principal</p>
          <h1 className="text-3xl font-bold text-neutral-900">Validar cupom</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cole ou digite o codigo apresentado pelo cliente. O retorno aparece imediatamente.
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          Historico: {usageHistory.length} uso(s)
        </div>
      </div>

      {/* Manual input */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-6">
        <label htmlFor="coupon-code" className="block text-sm font-semibold text-neutral-700 mb-2">
          Codigo do cupom
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="coupon-code"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(normalizeCouponCode(e.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleValidate()
              }
            }}
            placeholder="Ex.: J7264G"
            inputMode="text"
            maxLength={32}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-14 flex-1 rounded-lg border border-neutral-300 px-4 text-base text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || !COUPON_CODE_PATTERN.test(normalizeCouponCode(manualCode)) || !restaurantId}
            className="h-14 rounded-lg bg-orange-500 px-8 text-base font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
          >
            {validating ? 'Validando...' : 'Validar'}
          </button>
        </div>
      </div>

      {/* Result overlay */}
      {result && (
        <div
          role={result.valid ? 'status' : 'alert'}
          aria-live="polite"
          className={`rounded-xl p-8 mb-6 text-center animate-fade-in ${
          result.valid
            ? 'bg-green-50 border-2 border-green-400'
            : 'bg-red-50 border-2 border-red-400'
          }`}
        >
          <div className={`text-5xl font-bold mb-3 ${
            result.valid ? 'text-green-500' : 'text-red-500'
          }`}>
            {result.valid ? 'OK' : '!'}
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            result.valid ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.valid ? 'Cupom validado' : 'Cupom invalido'}
          </h2>
          {result.valid && result.user_name && (
            <p className="text-green-600 font-medium">{result.user_name}</p>
          )}
          {!result.valid && result.reason && (
            <p className="text-red-600 text-sm mt-1">{result.reason}</p>
          )}
        </div>
      )}

      {/* Usage history */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Historico de uso ({usageHistory.length})
        </h2>
        {usageHistory.length === 0 ? (
          <p className="text-neutral-400 text-sm">Nenhum cupom validado ainda</p>
        ) : (
          <ul className="space-y-3">
            {usageHistory.map((v) => (
              <li key={v.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0">
                <span className="text-sm font-bold text-green-600" aria-hidden>OK</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-neutral-800">
                    {v.profiles?.full_name ?? 'Cliente sem nome'}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-semibold tracking-[0.12em] text-neutral-500">
                    {v.short_code ? `Codigo ${v.short_code}` : 'Codigo nao registrado'}
                  </span>
                </span>
                <span className="text-right text-neutral-400 text-sm">
                  {v.used_at ? formatDateTime(v.used_at) : '--:--'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
