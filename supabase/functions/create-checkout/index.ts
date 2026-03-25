import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLAN_CONFIG: Record<string, { amount: number; name: string; description: string; frequency: string }> = {
  monthly: { amount: 1490, name: 'Mensal +um', description: '10 cupons/mes', frequency: 'MONTHLY' },
  annual: { amount: 8990, name: 'Anual +um', description: '100 cupons/ano', frequency: 'YEARLY' },
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
  if (!apiKey) {
    console.error('[CHECKOUT] ABACATEPAY_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Payment provider not configured' }), { status: 500 })
  }

  // Verify user auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Parse request
  let body: { plan_type: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const config = PLAN_CONFIG[body.plan_type]
  if (!config) {
    return new Response(JSON.stringify({ error: 'Invalid plan_type. Use "monthly" or "annual"' }), { status: 400 })
  }

  // Check for existing active subscription
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: existingSub } = await adminClient
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'pending'])
    .limit(1)
    .single()

  if (existingSub) {
    return new Response(JSON.stringify({ error: 'Voce ja possui uma assinatura ativa ou pendente' }), { status: 409 })
  }

  // Create billing on AbacatePay (server-side — API key never exposed to client)
  const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      frequency: config.frequency,
      methods: ['PIX'],
      products: [{
        externalId: `maisum-${body.plan_type}`,
        name: config.name,
        description: config.description,
        quantity: 1,
        price: config.amount,
      }],
      returnUrl: 'maisum://tabs/profile/subscription',
      completionUrl: 'maisum://tabs/profile/subscription',
      customer: { email: user.email },
      metadata: {
        user_id: user.id,
        plan_type: body.plan_type,
      },
    }),
  })

  const result = await abacateResponse.json()

  if (!abacateResponse.ok) {
    console.error('[CHECKOUT] AbacatePay error:', result)
    return new Response(JSON.stringify({ error: 'Erro ao criar cobranca' }), { status: 502 })
  }

  // NOTE: Subscription is NOT created here — the webhook billing.paid handles that
  // This prevents ghost subscriptions from abandoned checkouts

  const checkoutUrl = result.data?.url || result.url
  const billingId = result.data?.id || result.id

  return new Response(JSON.stringify({ checkout_url: checkoutUrl, billing_id: billingId }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
