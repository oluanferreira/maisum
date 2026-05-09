'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, DeviceMobile, QrCode } from '@phosphor-icons/react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/../lib/supabase/client'

type Restaurant = {
  id: string
  name: string
  city_name?: string | null
  state?: string | null
  cities?: { name?: string | null; state?: string | null } | null
}

const supabase = createClient()

function getAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://app.appmaisum.com.br').replace(/\/$/, '')
}

export default function PartnerKitPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadRestaurant() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cities(name, state)')
        .eq('admin_user_id', user.id)
        .single()

      if (error) console.error('Erro ao carregar restaurante para kit:', error)
      if (data) setRestaurant(data as Restaurant)
      setLoading(false)
    }

    loadRestaurant()
  }, [])

  const publicUrl = useMemo(() => {
    if (!restaurant) return ''
    return `${getAppBaseUrl()}/share/restaurants/${restaurant.id}`
  }, [restaurant])

  const city = restaurant?.cities
  const locationLabel = [city?.name, city?.state].filter(Boolean).join(' - ')
  const storyCopy = restaurant
    ? `Pediu um, ganhou +um no ${restaurant.name}. Chama seu +um e vem descobrir essa mesa${city?.name ? ` em ${city.name}` : ''}.`
    : ''

  async function copyStoryText() {
    await navigator.clipboard.writeText(storyCopy)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-neutral-900">Kit parceiro</h1>
        <p className="mt-2 text-neutral-600">
          Nenhum restaurante vinculado a esta conta. Vincule um restaurante para gerar o kit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#1A1A2E] via-[#251C1A] to-[#FF6B35] p-8 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-200">Kit parceiro</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight">
          Divulgue o +um do {restaurant.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/80">
          Use o QR Code no balcao, mesas, caixa ou bio. O cliente abre direto a pagina publica do seu restaurante no app +um.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <QrCode size={22} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Para mesa, caixa e bio</p>
              <h2 className="text-xl font-bold text-neutral-900">QR Code do restaurante</h2>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-neutral-200">
              <QRCodeSVG
                value={publicUrl}
                size={260}
                level="M"
                includeMargin
                title={`QR Code do restaurante ${restaurant.name}`}
              />
            </div>
            <p className="w-full break-words rounded-lg bg-neutral-50 p-3 text-xs font-medium text-neutral-600">
              {publicUrl}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <DeviceMobile size={22} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Instagram</p>
              <h2 className="text-xl font-bold text-neutral-900">Story pronto para postar</h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div className="mx-auto rounded-[2rem] bg-black p-2 shadow-2xl">
              <div className="flex aspect-[9/16] w-[190px] flex-col justify-between overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-[#FF6B35] via-[#4A2A1F] to-[#1A1A2E] p-4 text-center text-white">
                <div>
                  <p className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[#1A1A2E]">
                    Mesa parceira +um
                  </p>
                  <h3 className="mt-6 text-2xl font-black leading-tight">{restaurant.name}</h3>
                  {locationLabel ? (
                    <p className="mt-2 text-xs font-bold text-white/75">{locationLabel}</p>
                  ) : null}
                </div>
                <p className="text-3xl font-black leading-none">
                  Pediu 1,
                  <br />
                  ganhou +um
                </p>
                <p className="text-xs font-bold text-white/85">Abra o QR, chame seu +um e venha compartilhar.</p>
              </div>
            </div>

            <div>
              <p className="rounded-xl bg-neutral-50 p-4 text-sm font-medium leading-relaxed text-neutral-700">
                {storyCopy}
              </p>
              <button
                type="button"
                onClick={copyStoryText}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-orange-600 px-4 text-sm font-bold text-white transition-colors hover:bg-orange-700"
              >
                <Copy size={16} weight="bold" />
                {copied ? 'Copiado' : 'Copiar texto do story'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
