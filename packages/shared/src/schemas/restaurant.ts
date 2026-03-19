import { z } from 'zod'

export const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome obrigatorio'),
  description: z.string(),
  address: z.string().min(5, 'Endereco obrigatorio'),
  city_id: z.string().uuid('Selecione uma cidade'),
  phone: z.string(),
  cuisine_type: z.string(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export type RestaurantFormData = z.infer<typeof restaurantSchema>
