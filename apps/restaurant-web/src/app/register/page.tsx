'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/../lib/supabase/client'

function RegisterForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [restaurantName, setRestaurantName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  // Validate token on mount
  useEffect(() => {
    validateToken()
  }, [])

  async function validateToken() {
    if (!token) {
      setError('Link invalido — nenhum token fornecido')
      setValidating(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('restaurant_invites')
      .select('*, restaurants(name)')
      .eq('token', token)
      .single()

    if (fetchError || !data) {
      setError('Link invalido')
      setValidating(false)
      return
    }

    if (data.used_at) {
      setError('Este link ja foi utilizado')
      setValidating(false)
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('Este link expirou')
      setValidating(false)
      return
    }

    setRestaurantName((data.restaurants as { name: string })?.name || '')
    setValid(true)
    setValidating(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome do responsavel e obrigatorio')
      return
    }
    if (!email.trim()) {
      setError('Email e obrigatorio')
      return
    }
    if (password.length < 8) {
      setError('Senha deve ter no minimo 8 caracteres')
      return
    }

    setLoading(true)

    // 1. Sign up user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (signUpError) {
      setError(`Erro ao criar conta: ${signUpError.message}`)
      setLoading(false)
      return
    }

    if (!signUpData.user) {
      setError('Erro inesperado ao criar usuario')
      setLoading(false)
      return
    }

    // 2. Mark invite as used
    const { error: updateError } = await supabase
      .from('restaurant_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token!)

    if (updateError) {
      console.error('Erro ao marcar convite como usado:', updateError)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
          <p className="text-sm text-neutral-600">Validando link...</p>
        </div>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Link Invalido</h1>
            <p className="mt-2 text-sm text-neutral-600">{error}</p>
            <p className="mt-4 text-sm text-neutral-500">
              Entre em contato com o administrador do +um para obter um novo link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Cadastro Realizado!</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Sua conta para o restaurante <strong>{restaurantName}</strong> foi criada com sucesso.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
            >
              Fazer Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">+um</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cadastro do restaurante <strong>{restaurantName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Nome do Responsavel
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-orange-600 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
