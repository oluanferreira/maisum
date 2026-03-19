import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '../types'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  city_id: string | null
  referral_code: string
  extra_coupons_this_month: number
  created_at: string
}

export async function getCurrentUser(supabase: SupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return profile
}

export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const profile = await getCurrentUser(supabase)
  return profile?.role ?? null
}

export async function isAuthenticated(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

export async function signIn(supabase: SupabaseClient, email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
}

export async function signOut(supabase: SupabaseClient) {
  return supabase.auth.signOut()
}

export async function resetPassword(supabase: SupabaseClient, email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}
