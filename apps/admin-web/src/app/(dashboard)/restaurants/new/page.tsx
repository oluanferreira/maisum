'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  isValidBrazilWhatsapp,
  maskBrazilWhatsapp,
  normalizeBrazilWhatsapp,
} from '@maisum/shared'

import { fetchCoordinates } from '@/lib/geocode'
const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city_id: z.string().uuid('Selecione uma cidade'),
  whatsapp: z
    .string()
    .refine(isValidBrazilWhatsapp, 'WhatsApp deve ter DDD e 9 digitos validos.'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

interface City {
  id: string
  name: string
}

export default function NewRestaurantPage() {
  const router = useRouter()
  const supabase = createClient()
  const [cities, setCities] = useState<City[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      whatsapp: '',
      latitude: 0,
      longitude: 0,
    },
  })

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    const { data } = await supabase.from('cities').select('id, name').order('name')
    if (data) setCities(data)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) {
      setError('Máximo de 5 fotos permitidas')
      return
    }

    const newPhotos = [...photos, ...files]
    setPhotos(newPhotos)

    // Generate previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(data: RestaurantFormData) {
    setSubmitting(true)
    setError('')

    try {
      // 1. Insert restaurant
      let lat = data.latitude
      let lng = data.longitude
      const selectedCity = cities.find((city) => city.id === data.city_id)
      const geo = await fetchCoordinates({ address: data.address, city: selectedCity?.name })
      if (geo) {
        lat = geo.lat
        lng = geo.lng
      }
      const { data: restaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert({
          name: data.name,
          description: null,
          address: data.address,
          city_id: data.city_id,
          phone: null,
          whatsapp: normalizeBrazilWhatsapp(data.whatsapp),
          cuisine_type: null,
          latitude: lat,
          longitude: lng,
          is_active: true,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 2. Upload photos if any
      if (photos.length > 0 && restaurant) {
        const photoUrls: string[] = []

        for (const photo of photos) {
          const ext = photo.name.split('.').pop()
          const fileName = `${restaurant.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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

          photoUrls.push(urlData.publicUrl)
        }

        // 3. Update restaurant with photo URLs
        if (photoUrls.length > 0) {
          await supabase
            .from('restaurants')
            .update({ photos: photoUrls })
            .eq('id', restaurant.id)
        }
      }

      router.push('/restaurants')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar restaurante'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-neutral-900">Novo Restaurante</h1>
          <p className="text-neutral-600">Cadastrar restaurante parceiro</p>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">WhatsApp</label>
          <div className="flex h-12 overflow-hidden rounded-lg border border-neutral-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
            <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-700">
              +55
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              {...register('whatsapp', {
                onChange: (event) => {
                  setValue('whatsapp', maskBrazilWhatsapp(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                },
              })}
              className="h-full w-full px-3 text-sm focus:outline-none"
              placeholder="(77) 99999-9999"
            />
          </div>
          {errors.whatsapp && (
            <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>
          )}
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

        {/* Photos */}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Fotos (máximo 5)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoSelect}
            disabled={photos.length >= 5}
            className="w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600 hover:file:bg-orange-100"
          />
          {photoPreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="group relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
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
            {submitting ? 'Salvando...' : 'Criar Restaurante'}
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
