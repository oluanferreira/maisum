'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

type City = {
  id: string
  name: string
  state: string
}

type ViaCepResult = {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export default function PartnerSignupPage() {
  const [cities, setCities] = useState<City[]>([])
  const [responsibleName, setResponsibleName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [cep, setCep] = useState('')
  const [cityId, setCityId] = useState('')
  const [addressBase, setAddressBase] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadCities() {
      const supabase = createClient()
      const { data, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, state')
        .eq('is_active', true)
        .order('name')

      if (citiesError) {
        setError('Não foi possível carregar as cidades disponíveis. Tente novamente.')
        return
      }

      setCities((data as City[]) || [])
    }

    loadCities()
  }, [])

  async function lookupCep() {
    const cleanCep = digitsOnly(cep)
    if (cleanCep.length !== 8) return

    setCepLoading(true)
    setError('')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = (await response.json()) as ViaCepResult

      if (!response.ok || data.erro || !data.localidade || !data.uf) {
        setError('CEP não encontrado. Confira e tente novamente.')
        return
      }

      const matchingCity = cities.find(
        (city) => city.name === data.localidade && city.state.toUpperCase() === data.uf?.toUpperCase(),
      )

      if (!matchingCity) {
        setCityId('')
        setError(`O +um ainda não está aceitando parceiros em ${data.localidade}-${data.uf}.`)
        return
      }

      setCityId(matchingCity.id)
      const parts = [data.logradouro, data.bairro].filter(Boolean)
      if (parts.length) setAddressBase(parts.join(', '))
    } catch {
      setError('Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente.')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const cleanCep = digitsOnly(cep)
    const cleanWhatsapp = digitsOnly(whatsapp)
    const city = cities.find((item) => item.id === cityId)

    if (responsibleName.trim().length < 2) {
      setError('Informe o nome do responsável.')
      return
    }
    if (restaurantName.trim().length < 2) {
      setError('Informe o nome do estabelecimento.')
      return
    }
    if (!email.trim()) {
      setError('Informe o email de acesso.')
      return
    }
    if (cleanWhatsapp.length < 10) {
      setError('Informe um WhatsApp válido.')
      return
    }
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (cleanCep.length !== 8) {
      setError('Informe um CEP válido.')
      return
    }
    if (!city) {
      setError('Selecione uma cidade atendida pelo +um.')
      return
    }
    if (addressBase.trim().length < 3 || number.trim().length < 1) {
      setError('Complete o endereço do estabelecimento.')
      return
    }

    const fullAddress = `${addressBase.trim()}, ${number.trim()}${
      complement.trim() ? ` · ${complement.trim()}` : ''
    } · ${city.name}-${city.state} · CEP ${cleanCep}`

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: responsibleName.trim(),
            partner_application: true,
            restaurant_name: restaurantName.trim(),
            restaurant_city_id: city.id,
            restaurant_address: fullAddress,
            restaurant_cep: cleanCep,
            restaurant_whatsapp: cleanWhatsapp,
          },
        },
      })

      if (signUpError) {
        const alreadyExists = signUpError.message.toLowerCase().includes('already')
        setError(
          alreadyExists
            ? 'Este email já possui uma conta. Entre com ele ou use outro email.'
            : 'Não foi possível enviar o cadastro. Confira os dados e tente novamente.',
        )
        return
      }

      if (!data.user) {
        setError('Não foi possível concluir o cadastro agora. Tente novamente.')
        return
      }

      if (data.session) {
        await supabase.auth.signOut()
      }

      setSuccess(true)
    } catch {
      setError('Não foi possível enviar o cadastro agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100d06] px-4 py-8 text-[#f4ede4]">
        <section className="w-full max-w-[470px] rounded-[30px] border border-[#332b20] bg-[#1b1710] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-9">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#43634d] bg-[#17251b] text-xl text-[#9fd3ab]">
            ✓
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a89b8c]">Cadastro recebido</p>
          <h1 className="mt-2 font-serif text-4xl italic leading-none">Agora é com o +um.</h1>
          <p className="mt-4 text-sm leading-6 text-[#b8aa9a]">
            Recebemos os dados do <strong className="text-[#f4ede4]">{restaurantName}</strong>. Seu estabelecimento ficou pendente para revisão e só será liberado no app e no Painel Parceiro depois da aprovação.
          </p>
          <Link
            href="/login"
            className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-[#a84f36] text-sm font-semibold text-[#f8eee3] transition-colors hover:bg-[#bd5a3d]"
          >
            Voltar para entrar
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#100d06] px-4 py-7 text-[#f4ede4] sm:py-10">
      <section className="mx-auto w-full max-w-[520px] rounded-[30px] border border-[#332b20] bg-[#1b1710] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mb-7">
          <Link href="/login" className="text-xs font-medium text-[#9f9182] hover:text-[#f0dfcf]">
            ← Voltar para entrar
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a89b8c]">Novo parceiro</p>
          <h1 className="mt-2 font-serif text-4xl italic leading-none">Leve seu negócio para o +um.</h1>
          <p className="mt-3 text-sm leading-6 text-[#a89b8c]">
            Preencha os dados abaixo. O cadastro fica pendente até a aprovação do time +um.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-[#8c3e3e] bg-[#2a1717] px-4 py-3 text-sm leading-5 text-[#f1b6b6]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#766b60]">Estabelecimento</p>
            <Field label="Nome do estabelecimento">
              <input
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                required
                maxLength={100}
                placeholder="Ex.: Restaurante da Praça"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.2fr]">
              <Field label="CEP">
                <input
                  value={cep}
                  onChange={(event) => setCep(digitsOnly(event.target.value).slice(0, 8))}
                  onBlur={lookupCep}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="45000000"
                  className={inputClass}
                />
                {cepLoading && <p className="mt-2 text-xs text-[#8e8274]">Buscando endereço...</p>}
              </Field>
              <Field label="Cidade">
                <select value={cityId} onChange={(event) => setCityId(event.target.value)} className={inputClass} required>
                  <option value="">Selecione</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} - {city.state}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Endereço">
              <input
                value={addressBase}
                onChange={(event) => setAddressBase(event.target.value)}
                placeholder="Rua, avenida e bairro"
                autoComplete="street-address"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-[0.7fr_1.3fr] gap-4">
              <Field label="Número">
                <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="123" className={inputClass} />
              </Field>
              <Field label="Complemento">
                <input
                  value={complement}
                  onChange={(event) => setComplement(event.target.value)}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-[#332b20] pt-5">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#766b60]">Responsável e acesso</p>
              <Field label="Nome do responsável">
                <input
                  value={responsibleName}
                  onChange={(event) => setResponsibleName(event.target.value)}
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(77) 99999-9999"
                  className={inputClass}
                />
              </Field>
              <Field label="Email de acesso">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@estabelecimento.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Crie uma senha">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Mínimo de 8 caracteres"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cepLoading}
            className="h-14 w-full rounded-full bg-[#a84f36] text-sm font-semibold text-[#f8eee3] transition-colors hover:bg-[#bd5a3d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Enviando cadastro...' : 'Enviar para aprovação'}
          </button>

          <p className="px-2 text-center text-[11px] leading-5 text-[#776b60]">
            O envio não ativa o estabelecimento automaticamente. O acesso de parceiro é liberado após a aprovação do +um.
          </p>
        </form>
      </section>
    </main>
  )
}

const inputClass =
  'h-13 min-h-[52px] w-full rounded-2xl border border-[#3a3329] bg-[#28231d] px-4 text-sm text-[#f4ede4] outline-none placeholder:text-[#786e63] focus:border-[#ff7657] focus:ring-2 focus:ring-[#ff7657]/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#e9ded1]">{label}</span>
      {children}
    </label>
  )
}
