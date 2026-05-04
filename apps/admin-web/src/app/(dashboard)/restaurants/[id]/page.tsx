'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/../lib/supabase/client'

const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string(),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city_id: z.string().uuid('Selecione uma cidade'),
  phone: z.string(),
  cuisine_type: z.string(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

interface City {
  id: string
  name: string
}

export default function RestaurantEditPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const restaurantId = params.id as string

  const [cities, setCities] = useState<City[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
  })

  useEffect(() => {
    loadCities()
    loadRestaurant()
  }, [restaurantId])

  async function loadCities() {
    const { data } = await supabase.from('cities').select('id, name').order('name')
    if (data) setCities(data)
  }

  async function loadRestaurant() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (fetchError || !data) {
      setError('Restaurante não encontrado')
      setLoading(false)
      return
    }

    reset({
      name: data.name,
      description: data.description || '',
      address: data.address,
      city_id: data.city_id,
      phone: data.phone || '',
      cuisine_type: data.cuisine_type || '',
      latitude: data.latitude,
      longitude: data.longitude,
    })

    setExistingPhotos(data.photos || [])
    setLoading(false)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const totalPhotos = existingPhotos.length + newPhotos.length + files.length
    if (totalPhotos > 5) {
      setError('Máximo de 5 fotos permitidas no total')
      return
    }

    const updated = [...newPhotos, ...files]
    setNewPhotos(updated)

    const previews = files.map((file) => URL.createObjectURL(file))
    setNewPreviews((prev) => [...prev, ...previews])
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPreviews[index])
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function removeExistingPhoto(photoUrl: string) {
    // Extract file path from URL
    const urlParts = photoUrl.split('/restaurant-photos/')
    if (urlParts.length === 2) {
      const filePath = urlParts[1]
      await supabase.storage.from('restaurant-photos').remove([filePath])
    }

    const updatedPhotos = existingPhotos.filter((p) => p !== photoUrl)
    setExistingPhotos(updatedPhotos)

    // Update in database
    await supabase
      .from('restaurants')
      .update({ photos: updatedPhotos })
      .eq('id', restaurantId)
  }

  async function onSubmit(data: RestaurantFormData) {
    setSubmitting(true)
    setError('')

    try {
      // MAISUM-AD-1.01: Best-effort geocoding automation
      let lat = data.latitude
      let lng = data.longitude

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}&limit=1`, {
          headers: { 'User-Agent': 'Maisum-Admin' }
        });
        const geoData = await res.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }

      // 1. Update restaurant data
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          name: data.name,
          description: data.description || null,
          address: data.address,
          city_id: data.city_id,
          phone: data.phone || null,
          cuisine_type: data.cuisine_type || null,
          latitude: lat,
          longitude: lng,
        })
        .eq('id', restaurantId)

      if (updateError) throw updateError

      // 2. Upload new photos if any
      let allPhotos = [...existingPhotos]

      if (newPhotos.length > 0) {
        for (const photo of newPhotos) {
          const ext = photo.name.split('.').pop()
          const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('restaurant-photos')
            .upload(fileName, photo)

          if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError)
            continue
          }

          const { data: urlData } = supabase.storage
            .from('restaurant-photos')
            .getPublicUrl(fileName)

          allPhotos.push(urlData.publicUrl)
        }

        // 3. Update photos array
        await supabase
          .from('restaurants')
          .update({ photos: allPhotos })
          .eq('id', restaurantId)
      }

      router.push('/restaurants')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar restaurante'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-500">Carregando...</p>
      </div>
    )
  }

  const totalPhotos = existingPhotos.length + newPhotos.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/restaurants"
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Editar Restaurante</h1>
          <p className="text-neutral-600">Atualizar informações do restaurante</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Nome *</label>
          <input
            type="text"
            {...register('name')}
            className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Nome do restaurante"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Descrição</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Descrição do restaurante"
          />
        </div>

        {/* Address */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Endereço *</label>
          <input
            type="text"
            {...register('address')}
            className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Endereço completo"
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Cidade *</label>
          <select
            {...register('city_id')}
            className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Selecione uma cidade</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.city_id && (
            <p className="mt-1 text-xs text-red-600">{errors.city_id.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Telefone</label>
          <input
            type="text"
            {...register('phone')}
            className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="(77) 99999-9999"
          />
        </div>

        {/* Cuisine Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Tipo de cozinha</label>
          <input
            type="text"
            {...register('cuisine_type')}
            className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Italiana, Japonesa, Brasileira..."
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Latitude *</label>
            <input
              type="number"
              step="any"
              {...register('latitude')}
              className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="-13.8569"
            />
            {errors.latitude && (
              <p className="mt-1 text-xs text-red-600">{errors.latitude.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Longitude *</label>
            <input
              type="number"
              step="any"
              {...register('longitude')}
              className="h-12 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="-40.0853"
            />
            {errors.longitude && (
              <p className="mt-1 text-xs text-red-600">{errors.longitude.message}</p>
            )}
          </div>
        </div>

        {/* Existing Photos */}
        {existingPhotos.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Fotos atuais
            </label>
            <div className="flex flex-wrap gap-3">
              {existingPhotos.map((photoUrl, index) => (
                <div key={index} className="group relative">
                  <img
                    src={photoUrl}
                    alt={`Foto ${index + 1}`}
                    className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photoUrl)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm hover:bg-red-600"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Photos */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Adicionar fotos ({totalPhotos}/5)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoSelect}
            disabled={totalPhotos >= 5}
            className="w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600 hover:file:bg-orange-100"
          />
          {newPreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {newPreviews.map((preview, index) => (
                <div key={index} className="group relative">
                  <img
                    src={preview}
                    alt={`Nova foto ${index + 1}`}
                    className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm hover:bg-red-600"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <Link
            href="/restaurants"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
