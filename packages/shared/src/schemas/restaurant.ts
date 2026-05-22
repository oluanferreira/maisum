import { z } from 'zod'
import { isValidBrazilWhatsapp } from '../utils/br-whatsapp'

export const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome obrigatorio'),
  address: z.string().min(5, 'Endereco obrigatorio'),
  city_id: z.string().uuid('Selecione uma cidade'),
  whatsapp: z
    .string()
    .refine(isValidBrazilWhatsapp, 'WhatsApp deve ter DDD e 9 digitos validos.'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export type RestaurantFormData = z.infer<typeof restaurantSchema>
