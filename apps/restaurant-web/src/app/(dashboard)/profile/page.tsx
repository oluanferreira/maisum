'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  cuisine_type: string | null
  logo_url: string | null
  photos: string[]
  cep: string | null
  city_id: string | null
}

const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const LOGO_ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

type LogoValidation = { ok: true } | { ok: false; error: string }

function validateLogoFile(file: { size: number; type: string }): LogoValidation {
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    return { ok: false, error: 'Arquivo muito grande — máximo 2MB' }
  }
  if (!LOGO_ACCEPTED_MIME.includes(file.type as typeof LOGO_ACCEPTED_MIME[number])) {
    return { ok: false, error: 'Formato não suportado — use PNG, JPG ou WebP' }
  }
  return { ok: true }
}

// ───────────────────────────────────────────────────────────────────────────
// MAISUM-RW-1.13: ViaCEP integration inline (legacy panel client-side)
// Pattern source: maisum-app/src/lib/data/viacep.ts (server-safe · 5s timeout
// · discriminated union). Replicated here client-side because legacy panel
// has no server actions infra (WAIVER-MAISUM-RW-1.13-CLIENT-SIDE-VIACEP).
// ───────────────────────────────────────────────────────────────────────────
type ViaCepData = { localidade: string; uf: string; cep: string }
type ViaCepResult =
  | { ok: true; data: ViaCepData }
  | { ok: false; error: 'not_found' | 'network' | 'invalid_format' }

function cleanCep(cep: string): string {
  return (cep ?? '').replace(/\D/g, '')
}

function formatCepInput(value: string): string {
  const cleaned = cleanCep(value).slice(0, 8)
  if (cleaned.length <= 5) return cleaned
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
}

async function fetchViaCepClient(cep: string): Promise<ViaCepResult> {
  const cleaned = cleanCep(cep)
  if (cleaned.length !== 8) return { ok: false, error: 'invalid_format' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return { ok: false, error: 'network' }
    const data = (await res.json()) as ViaCepData & { erro?: boolean }
    if (data?.erro) return { ok: false, error: 'not_found' }
    return { ok: true, data }
  } catch {
    clearTimeout(timer)
    return { ok: false, error: 'network' }
  }
}

interface ActiveCity {
  id: string
  name: string
  state: string
}

type CepLookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success-active'; city: ActiveCity }
  | { status: 'success-inactive'; localidade: string; uf: string }
  | { status: 'not_found' }
  | { status: 'network' }

export default function ProfilePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [lastFailedLogoFile, setLastFailedLogoFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; retry?: 'logo' } | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  // MAISUM-RW-1.13: CEP + city resolution state
  const [cep, setCep] = useState('')
  const [cepLookup, setCepLookup] = useState<CepLookupState>({ status: 'idle' })
  const [activeCities, setActiveCities] = useState<ActiveCity[]>([])
  interface HoursSlot { days: number[]; open: string; close: string }
  const [hoursSlots, setHoursSlots] = useState<HoursSlot[]>([
    { days: [1, 2, 3, 4, 5], open: '11:00', close: '22:00' },
    { days: [0, 6], open: '11:00', close: '23:00' },
  ])
  const [photos, setPhotos] = useState<string[]>([])

  const WEEKDAYS = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sab' },
  ]

  function hoursToString(slots: HoursSlot[]): string {
    return slots
      .filter(s => s.days.length > 0)
      .map(s => {
        const dayLabels = s.days.map(d => WEEKDAYS[d]?.label).join(', ')
        return `${dayLabels} ${s.open}-${s.close}`
      })
      .join(' | ')
  }

  function parseHoursString(str: string): HoursSlot[] {
    if (!str || str.trim() === '') return [{ days: [1, 2, 3, 4, 5], open: '11:00', close: '22:00' }]
    // Keep existing slots if already parsed, otherwise return default
    return hoursSlots
  }

  const supabase = createClient()

  // MAISUM-RW-1.13: cities lookup helper (closure captures supabase + state)
  async function resolveCepLookup(cepValue: string, citiesOverride?: ActiveCity[]) {
    const cleaned = cleanCep(cepValue)
    if (cleaned.length !== 8) {
      setCepLookup({ status: 'idle' })
      return
    }
    setCepLookup({ status: 'loading' })
    const result = await fetchViaCepClient(cepValue)
    if (!result.ok) {
      setCepLookup(
        result.error === 'not_found' ? { status: 'not_found' } : { status: 'network' },
      )
      return
    }
    const cities = citiesOverride && citiesOverride.length > 0 ? citiesOverride : activeCities
    const targetName = result.data.localidade.toLowerCase().trim()
    const targetState = result.data.uf.toLowerCase().trim()
    const matched = cities.find(
      (c) =>
        c.name.toLowerCase().trim() === targetName &&
        c.state.toLowerCase().trim() === targetState,
    )
    if (matched) {
      setCepLookup({ status: 'success-active', city: matched })
    } else {
      setCepLookup({
        status: 'success-inactive',
        localidade: result.data.localidade,
        uf: result.data.uf,
      })
    }
  }

  useEffect(() => {
    loadRestaurant()
    void loadActiveCities()
  }, [])

  async function loadActiveCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state')
      .eq('is_active', true)
    if (error) {
      console.error('[MAISUM-RW-1.13] active cities load failed:', error)
      return
    }
    if (data) setActiveCities(data as ActiveCity[])
  }

  async function loadRestaurant() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('admin_user_id', user.id)
      .single()

    if (error) {
      console.error('Erro ao carregar restaurante:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar dados do restaurante' })
      setLoading(false)
      return
    }

    if (data) {
      setRestaurant(data)
      setName(data.name || '')
      setDescription(data.description || '')
      setAddress(data.address || '')
      setPhone(data.phone || '')
      setCuisineType(data.cuisine_type || '')
      // Parse hours_of_operation or use defaults
      if (data.hours_of_operation) {
        // Keep parsed slots
      }
      setLogoUrl(data.logo_url || null)
      setPhotos(data.photos || [])
      // MAISUM-RW-1.13: load existing CEP + trigger lookup to display detected city
      const existingCep = (data.cep as string | null) || ''
      setCep(formatCepInput(existingCep))
      if (cleanCep(existingCep).length === 8) {
        void resolveCepLookup(existingCep)
      }
    }

    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant) return

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Nome e obrigatorio' })
      return
    }
    // MAISUM-RW-1.13: CEP + city validation BEFORE address
    const cleanedCep = cleanCep(cep)
    if (cleanedCep.length !== 8) {
      setMessage({ type: 'error', text: 'CEP e obrigatorio (8 digitos)' })
      return
    }
    if (cepLookup.status === 'loading') {
      setMessage({ type: 'error', text: 'Aguarde a deteccao da cidade pelo CEP...' })
      return
    }
    if (cepLookup.status === 'not_found' || cepLookup.status === 'network' || cepLookup.status === 'idle') {
      setMessage({ type: 'error', text: 'CEP invalido ou nao encontrado. Verifique e tente novamente.' })
      return
    }
    if (cepLookup.status === 'success-inactive') {
      setMessage({
        type: 'error',
        text: `Sua cidade (${cepLookup.localidade} · ${cepLookup.uf}) ainda nao esta disponivel no MAISUM. Entre em contato pelo WhatsApp se quiser que sua cidade seja ativada.`,
      })
      return
    }
    // cepLookup.status === 'success-active' confirmed
    if (!address.trim()) {
      setMessage({ type: 'error', text: 'Endereco e obrigatorio' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('restaurants')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim(),
        phone: phone.trim() || null,
        cuisine_type: cuisineType.trim() || null,
        photos,
        cep: cleanedCep,
        city_id: cepLookup.city.id,
      })
      .eq('id', restaurant.id)

    // Note: hours_of_operation stored as formatted string for now
    // Instagram/website will be stored once columns are added

    if (error) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    }

    setSaving(false)
  }

  async function uploadLogoFile(file: File) {
    if (!restaurant) return
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `logos/${restaurant.id}.${ext}`

    setLogoUploading(true)
    setMessage(null)

    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      console.error('[logo-upload] storage error:', uploadError)
      setLastFailedLogoFile(file)
      setLogoUploading(false)
      setMessage({
        type: 'error',
        text: `Erro ao enviar logomarca: ${uploadError.message}`,
        retry: 'logo',
      })
      return
    }

    const { data: urlData } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(path)

    // Cache-buster: append timestamp so cliente PWA não veja logo stale ao trocar
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: publicUrl })
      .eq('id', restaurant.id)

    if (updateError) {
      console.error('[logo-upload] db update error:', updateError)
      setLastFailedLogoFile(file)
      setLogoUploading(false)
      setMessage({
        type: 'error',
        text: `Logomarca enviada, mas falhou ao gravar no banco: ${updateError.message}`,
        retry: 'logo',
      })
      return
    }

    setLogoUrl(publicUrl)
    setLastFailedLogoFile(null)
    setLogoUploading(false)
    setMessage({ type: 'success', text: 'Logomarca atualizada!' })
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!restaurant || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    e.target.value = '' // reset input para permitir mesmo arquivo de novo

    const validation = validateLogoFile(file)
    if (!validation.ok) {
      setMessage({ type: 'error', text: validation.error })
      return
    }

    await uploadLogoFile(file)
  }

  async function handleLogoRetry() {
    if (!lastFailedLogoFile) return
    await uploadLogoFile(lastFailedLogoFile)
  }

  async function handleLogoRemove() {
    if (!restaurant || !logoUrl) return
    setLogoUploading(true)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: null })
      .eq('id', restaurant.id)

    if (updateError) {
      console.error('[logo-remove] db update error:', updateError)
      setLogoUploading(false)
      setMessage({ type: 'error', text: `Erro ao remover logomarca: ${updateError.message}` })
      return
    }

    setLogoUrl(null)
    setLogoUploading(false)
    setMessage({ type: 'success', text: 'Logomarca removida.' })
  }

  // MAISUM-RW-1.15 AC-1 — single hero photo upload. Sobrescreve photos[0] (single-element
  // array preserves text[] schema · backward-compat · consumidores no maisum-app usam ?.[0]).
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!restaurant || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${restaurant.id}/${Date.now()}.${fileExt}`

    setUploading(true)
    setMessage(null)

    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(fileName, file)

    if (uploadError) {
      setMessage({ type: 'error', text: `Erro no upload: ${uploadError.message}` })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(fileName)

    // Sobrescreve (single-element array) em vez de append. Cache-buster query param
    // preserva immediate refresh do preview no profile (mesma técnica RW-1.12 logo).
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`
    setPhotos([publicUrl])
    setUploading(false)
    setMessage({ type: 'success', text: 'Foto principal atualizada! Clique em Salvar para confirmar.' })

    // Reset input
    e.target.value = ''
  }

  function removePhoto() {
    // MAISUM-RW-1.15 AC-1 — remove single hero photo (clear array preserves text[] schema).
    setPhotos([])
    setMessage({ type: 'success', text: 'Foto removida. Clique em Salvar para confirmar.' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-600">Nenhum restaurante vinculado a sua conta.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Perfil do Restaurante</h1>
        <p className="text-neutral-600">Gerencie as informacoes do seu restaurante</p>
      </div>

      {/* Message */}
      {message && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          {message.type === 'error' && message.retry === 'logo' && lastFailedLogoFile && (
            <button
              type="button"
              onClick={handleLogoRetry}
              disabled={logoUploading}
              className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {logoUploading ? 'Enviando...' : 'Tentar de novo'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo (logomarca) */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">Logomarca</h2>
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-orange-200 bg-neutral-50">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logomarca do restaurante"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
                  </svg>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12" />
                </svg>
                {logoUploading
                  ? 'Enviando...'
                  : logoUrl
                    ? 'Trocar logomarca'
                    : 'Adicionar logomarca'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoSelect}
                  disabled={logoUploading}
                  className="hidden"
                  data-testid="logo-upload"
                />
              </label>
              {logoUrl && !logoUploading && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="ml-2 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                PNG, JPG ou WebP · até 2MB · ideal: 512×512px
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">Informacoes Basicas</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Tipo de Cozinha
              </label>
              <input
                type="text"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="Ex: Italiana, Japonesa, Brasileira"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Descricao
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descreva seu restaurante para os clientes..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* MAISUM-RW-1.13: CEP field BEFORE address — drives city detection */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                CEP *
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => {
                  const formatted = formatCepInput(e.target.value)
                  setCep(formatted)
                  if (cleanCep(formatted).length < 8) setCepLookup({ status: 'idle' })
                }}
                onBlur={() => {
                  if (cleanCep(cep).length === 8) void resolveCepLookup(cep)
                }}
                placeholder="Ex: 45000-000"
                maxLength={9}
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              {/* CEP lookup status display (5 states · cores semânticas) */}
              {cepLookup.status === 'loading' && (
                <p className="mt-1 text-xs text-neutral-600">Detectando cidade...</p>
              )}
              {cepLookup.status === 'success-active' && (
                <p className="mt-1 text-xs text-green-700">
                  Cidade detectada: {cepLookup.city.name} · {cepLookup.city.state}
                </p>
              )}
              {cepLookup.status === 'success-inactive' && (
                <p className="mt-1 text-xs text-orange-700">
                  Cidade detectada: {cepLookup.localidade} · {cepLookup.uf} · ainda nao disponivel no MAISUM
                </p>
              )}
              {cepLookup.status === 'not_found' && (
                <p className="mt-1 text-xs text-red-700">CEP nao encontrado · verifique os digitos</p>
              )}
              {cepLookup.status === 'network' && (
                <p className="mt-1 text-xs text-red-700">Erro ao detectar cidade · tente de novo</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Endereco *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, numero, bairro, cidade"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

          </div>
        </div>

        {/* Hours of Operation */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800">Horario de Funcionamento</h2>
            {hoursSlots.length < 4 && (
              <button
                type="button"
                onClick={() => setHoursSlots([...hoursSlots, { days: [], open: '11:00', close: '22:00' }])}
                className="text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                + Adicionar faixa
              </button>
            )}
          </div>

          <div className="space-y-4">
            {hoursSlots.map((slot, idx) => (
              <div key={idx} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    {idx === 0 ? 'Dias de semana' : idx === 1 ? 'Finais de semana' : `Faixa ${idx + 1}`}
                  </span>
                  {hoursSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setHoursSlots(hoursSlots.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const updated = [...hoursSlots]
                        const s = updated[idx]
                        s.days = s.days.includes(day.value)
                          ? s.days.filter((d) => d !== day.value)
                          : [...s.days, day.value].sort()
                        setHoursSlots(updated)
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        slot.days.includes(day.value)
                          ? 'bg-orange-600 text-white'
                          : 'border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">Abre</label>
                    <input
                      type="time"
                      value={slot.open}
                      onChange={(e) => {
                        const updated = [...hoursSlots]
                        updated[idx].open = e.target.value
                        setHoursSlots(updated)
                      }}
                      className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">Fecha</label>
                    <input
                      type="time"
                      value={slot.close}
                      onChange={(e) => {
                        const updated = [...hoursSlots]
                        updated[idx].close = e.target.value
                        setHoursSlots(updated)
                      }}
                      className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-neutral-400">
            Resumo: {hoursToString(hoursSlots) || 'Nenhum horario configurado'}
          </p>
        </div>

        {/* Social & Web */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">Redes Sociais e Site</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Instagram
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">@</span>
                <input
                  type="text"
                  placeholder="nomedorestaurante"
                  className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-400">Clientes poderao visitar seu perfil pelo app</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Site
              </label>
              <input
                type="url"
                placeholder="https://www.meurestaurante.com.br"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <p className="mt-1 text-xs text-neutral-400">Link do site ou cardapio online</p>
            </div>
          </div>
        </div>

        {/* Photos · MAISUM-RW-1.15 AC-1: single hero photo 16:9 (era 5 slots aspect-square)
            Schema preserved: photos text[] continua array · UI mostra/edita só photos[0].
            Aspect ratio 16:9 via CSS · sem crop forçado (TD-MAISUM-RW-1.15-PHOTO-CROP LOW). */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-neutral-800">
            Foto Principal
          </h2>
          <p className="mb-4 text-xs text-neutral-500">
            Foto horizontal 16:9 que aparece na lista de restaurantes e no topo do seu perfil.
          </p>

          {/* Single hero photo preview · 16:9 aspect ratio · object-cover */}
          {photos.length > 0 ? (
            <div className="group relative aspect-[16/9] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              <img
                src={photos[0]}
                alt="Foto principal do restaurante"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Remover foto"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-medium text-white shadow-md transition-opacity hover:bg-red-700"
              >
                ✕
              </button>
              <label className="absolute bottom-2 left-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-orange-700 shadow-sm transition-colors hover:bg-orange-50">
                {uploading ? 'Enviando...' : 'Substituir foto'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? 'Enviando...' : 'Carregar imagem'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-600 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </form>
    </div>
  )
}
