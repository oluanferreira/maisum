'use server'

import { createClient } from '@/../lib/supabase/server'
import { fetchCoordinates } from '@/lib/geocode'
import { revalidatePath } from 'next/cache'

export async function updateRestaurant(id: string, formData: any) {
  const supabase = await createClient()

  // 1. Verify session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  // 2. Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { ok: false, error: 'Acesso negado: apenas administradores.' }
  }

  // 3. Resolve city name for geocoding fallback
  let cityName = ''
  if (formData.city_id) {
    const { data: city } = await supabase
      .from('cities')
      .select('name')
      .eq('id', formData.city_id)
      .single()
    cityName = city?.name || ''
  }

  // 4. Best-effort geocoding
  const coords = await fetchCoordinates({
    address: formData.address,
    city: cityName,
  })

  // 5. Update database
  const { error: updateError } = await supabase
    .from('restaurants')
    .update({
      name: formData.name,
      description: formData.description || null,
      address: formData.address,
      city_id: formData.city_id,
      phone: formData.phone || null,
      cuisine_type: formData.cuisine_type || null,
      latitude: coords?.lat ?? formData.latitude,
      longitude: coords?.lng ?? formData.longitude,
      is_active: true, // Garante que continue ativo
    })
    .eq('id', id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/restaurants')
  revalidatePath(`/restaurants/${id}`)
  
  return { ok: true }
}
