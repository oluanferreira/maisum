'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/../lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/validate')
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#100d06] px-4 py-8 text-[#f4ede4]">
      <section className="w-full max-w-[420px] rounded-[30px] border border-[#332b20] bg-[#1b1710] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a89b8c]">
            Painel parceiro
          </p>
          <h1 className="mt-2 font-serif text-4xl italic leading-none text-[#f4ede4]">+um Parceiro</h1>
          <p className="mt-3 text-sm leading-6 text-[#a89b8c]">
            Acesse sua operação para validar cupons e atualizar os itens da promoção.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-[#8c3e3e] bg-[#2a1717] px-4 py-3 text-sm text-[#f1b6b6]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#e9ded1]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-14 w-full rounded-full border border-[#3a3329] bg-[#28231d] px-5 text-sm text-[#f4ede4] outline-none placeholder:text-[#8e8274] focus:border-[#ff7657] focus:ring-2 focus:ring-[#ff7657]/20"
              placeholder="parceiro@maisum.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#e9ded1]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="h-14 w-full rounded-full border border-[#3a3329] bg-[#28231d] px-5 text-sm text-[#f4ede4] outline-none placeholder:text-[#8e8274] focus:border-[#ff7657] focus:ring-2 focus:ring-[#ff7657]/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 w-full rounded-full bg-[#a84f36] text-sm font-semibold text-[#f8eee3] transition-colors hover:bg-[#bd5a3d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
