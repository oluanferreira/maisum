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

  useEffect(() => {
    loadRestaurant()
  }, [])

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!restaurant || !e.target.files || e.target.files.length === 0) return

    if (photos.length >= 5) {
      setMessage({ type: 'error', text: 'Maximo de 5 fotos atingido' })
      return
    }

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

    setPhotos((prev) => [...prev, urlData.publicUrl])
    setUploading(false)
    setMessage({ type: 'success', text: 'Foto adicionada! Clique em Salvar para confirmar.' })

    // Reset input
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
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

        {/* Photos */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">
            Fotos ({photos.length}/5)
          </h2>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {photos.map((url, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200">
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    X
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-orange-600 px-1.5 py-0.5 text-xs font-medium text-white">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          {photos.length < 5 && (
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-6 transition-colors hover:border-orange-400 hover:bg-orange-50">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="mt-2 text-sm text-neutral-600">
                  {uploading ? 'Enviando...' : 'Clique para adicionar foto'}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
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
