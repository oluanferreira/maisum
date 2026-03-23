import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Auth and data will not work.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey || 'missing-key-check-env',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)
