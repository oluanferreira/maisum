import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AuthState {
  session: Session | null
  subscription: {
    status: string
    current_period_end: string
  } | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  fetchSubscription: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  subscription: null,
  isLoading: true,
  setSession: (session) => {
    set({ session })
    if (session) get().fetchSubscription()
  },
  setLoading: (isLoading) => set({ isLoading }),

  fetchSubscription: async () => {
    const session = get().session
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        set({ subscription: data })
      } else {
        set({ subscription: null })
      }
    } catch (err) {
      console.error('[AuthStore] Erro ao buscar assinatura:', err)
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null })
  },
}))
