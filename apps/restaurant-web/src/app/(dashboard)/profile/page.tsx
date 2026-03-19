'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../../lib/supabase/client'

interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  cuisine_type: string | null
  photos: string[]
}

export default function ProfilePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [hours, setHours] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

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
      setHours(data.hours_of_operation || '')
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

    if (error) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    }

    setSaving(false)
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
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
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

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Horario de Funcionamento
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ex: Seg-Sex 11h-22h, Sab-Dom 11h-23h"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
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
