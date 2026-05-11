ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS instagram_url text;

COMMENT ON COLUMN public.restaurants.whatsapp IS 'Public WhatsApp/contact number for restaurant service.';
COMMENT ON COLUMN public.restaurants.instagram_url IS 'Public Instagram profile URL or handle for restaurant contact/discovery.';
