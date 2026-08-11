'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/../lib/supabase/client'
import { trackRestaurantEvent } from '@/lib/analytics'

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
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
}

export default function ValidatePage() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

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

    void init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleValidate = useCallback(async () => {
    const couponCode = normalizeCouponCode(manualCode)

    if (!couponCode || !restaurantId) return

    if (!COUPON_CODE_PATTERN.test(couponCode)) {
      setResult({ valid: false, reason: 'O código deve ter 6 letras ou números.' })
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
        setResult({ valid: false, reason: 'Não foi possível validar agora. Tente novamente.' })
      } else {
        const validation = data as ValidationResult
        setResult(validation)

        if (validation?.valid) {
          await trackRestaurantEvent(supabase, {
            eventName: 'experience_validated',
            pathname: '/validate',
            restaurantId,
            couponId: validation.coupon_id ?? couponCode,
            metadata: { inputMode: 'manual' },
          })
          await loadUsageHistory(restaurantId)
          setManualCode('')
        }
      }
    } catch (err) {
      console.error('Unexpected coupon validation failure:', err)
      setResult({ valid: false, reason: 'Erro ao validar cupom.' })
    } finally {
      setValidating(false)
      window.setTimeout(() => setResult(null), 8000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCode, restaurantId, loadUsageHistory])

  const formatDateTime = (isoStr: string): string => {
    const date = new Date(isoStr)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7657] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff7657]">
          Operação do parceiro
        </p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[#f4ede4]">
          Validar cupom
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#a89b8c]">
          Confira o código apresentado pelo cliente para liberar o benefício.
        </p>
      </div>

      <section className="rounded-[26px] border border-[#332b20] bg-[#1b1710] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <label htmlFor="coupon-code" className="mb-3 block text-sm font-semibold text-[#f4ede4]">
          Código do cupom
        </label>

        <input
          id="coupon-code"
          type="text"
          value={manualCode}
          onChange={(event) => setManualCode(normalizeCouponCode(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleValidate()
            }
          }}
          placeholder="Ex.: J7264G"
          inputMode="text"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          className="h-14 w-full rounded-full border border-[#3a3329] bg-[#28231d] px-5 text-center font-mono text-lg font-semibold tracking-[0.2em] text-[#f4ede4] outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#8e8274] focus:border-[#ff7657] focus:ring-2 focus:ring-[#ff7657]/20"
        />

        <button
          type="button"
          onClick={() => void handleValidate()}
          disabled={validating || !COUPON_CODE_PATTERN.test(normalizeCouponCode(manualCode)) || !restaurantId}
          className="mt-3 h-14 w-full rounded-full bg-[#a84f36] text-base font-semibold text-[#f8eee3] transition-colors hover:bg-[#bd5a3d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {validating ? 'Validando...' : 'Validar'}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-[#8e8274]">
          Digite os 6 caracteres do código exibido no cupom do cliente.
        </p>
      </section>

      {result && (
        <section
          role={result.valid ? 'status' : 'alert'}
          aria-live="polite"
          className={result.valid ? 'rounded-[26px] border border-[#3e7656] bg-[#17261d] p-5' : 'rounded-[26px] border border-[#8c3e3e] bg-[#2a1717] p-5'}
        >
          <div className="flex items-start gap-3">
            <div
              className={result.valid ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2d704b] text-lg font-bold text-[#d8f4df]' : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#873d3d] text-lg font-bold text-[#ffdede]'}
              aria-hidden
            >
              {result.valid ? '✓' : '!'}
            </div>
            <div className="min-w-0">
              <h2 className={result.valid ? 'text-base font-semibold text-[#c7f0d2]' : 'text-base font-semibold text-[#ffd0d0]'}>
                {result.valid ? 'Cupom validado' : 'Cupom não validado'}
              </h2>
              {result.valid && result.user_name && (
                <p className="mt-1 text-sm text-[#a9dcb5]">{result.user_name}</p>
              )}
              {!result.valid && result.reason && (
                <p className="mt-1 text-sm leading-5 text-[#f1b6b6]">{result.reason}</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[26px] border border-[#332b20] bg-[#17130d] p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e8274]">
              Operação
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#f4ede4]">Últimos resgates</h2>
          </div>
          <span className="rounded-full bg-[#2b2118] px-3 py-1 text-xs font-semibold text-[#e1b19f]">
            {usageHistory.length}
          </span>
        </div>

        {usageHistory.length === 0 ? (
          <p className="mt-5 text-sm text-[#8e8274]">Nenhum cupom validado ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#2b241b]">
            {usageHistory.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#203b2a] text-sm font-bold text-[#9bdbaf]" aria-hidden>
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#e9ded1]">
                    {item.profiles?.full_name ?? 'Cliente sem nome'}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] font-semibold tracking-[0.12em] text-[#8e8274]">
                    {item.short_code ? 'Código ' + item.short_code : 'Código não registrado'}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-[#8e8274]">
                  {item.used_at ? formatDateTime(item.used_at) : '--:--'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
