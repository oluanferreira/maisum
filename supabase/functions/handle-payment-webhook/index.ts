import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- HMAC Signature Verification ---
async function hmacSHA256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// --- Placeholder: Push Notification ---
async function sendPush(
  _supabase: ReturnType<typeof createClient>,
  _userId: string,
  notification: { title: string; body: string },
): Promise<void> {
  // TODO: Integrate with Expo Push Notifications or OneSignal
  console.log(`[PUSH PLACEHOLDER] to user ${_userId}:`, notification)
}

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('[WEBHOOK] ABACATEPAY_WEBHOOK_SECRET not configured')
    return new Response('Server misconfigured', { status: 500 })
  }

  // 1. Read raw body for signature verification
  const body = await req.text()

  // 2. Verify webhook signature (anti-spoofing)
  const signature = req.headers.get('x-abacatepay-signature')
  if (!signature) {
    console.warn('[WEBHOOK] Missing signature header')
    return new Response('Missing signature', { status: 401 })
  }

  const expectedSig = await hmacSHA256(body, webhookSecret)
  if (signature.length !== expectedSig.length || signature !== expectedSig) {
    console.warn('[WEBHOOK] Invalid signature')
    return new Response('Invalid signature', { status: 401 })
  }

  // 3. Parse event
  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    console.error('[WEBHOOK] Invalid JSON body')
    return new Response('Invalid JSON', { status: 400 })
  }

  // 4. Create admin Supabase client (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 5. Log every event for debugging/auditing
  const { error: logError } = await supabase.from('webhook_logs').insert({
    event_type: event.type,
    payload: event,
    processed_at: new Date().toISOString(),
  })
  if (logError) {
    console.error('[WEBHOOK] Failed to log event:', logError.message)
  }

  // 6. Idempotency check — skip if already processed
  if (event.data?.payment_id) {
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('abacatepay_payment_id', event.data.payment_id)
      .limit(1)
      .single()

    if (existingPayment) {
      console.log(`[WEBHOOK] Already processed payment ${event.data.payment_id}, skipping`)
      return new Response('Already processed', { status: 200 })
    }
  }

  // 7. Handle event by type
  try {
    switch (event.type) {
      case 'billing.paid': {
        const userId = event.data?.metadata?.user_id
        const planType = event.data?.metadata?.plan_type || 'monthly'
        const billingId = event.data?.id || event.data?.subscription_id

        if (!userId) {
          console.error('[WEBHOOK] billing.paid missing user_id in metadata')
          break
        }

        // Upsert subscription (create if not exists, update if exists)
        const periodEnd = planType === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            abacatepay_subscription_id: billingId,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
          }, { onConflict: 'abacatepay_subscription_id' })
          .select()
          .single()

        if (subError || !sub) {
          console.error('[WEBHOOK] Failed to upsert subscription:', subError?.message)
          break
        }

        // Record payment (idempotent — checked above)
        const { error: payError } = await supabase.from('payments').insert({
          subscription_id: sub.id,
          amount: event.data.amount || (planType === 'monthly' ? 1490 : 8990),
          status: 'paid',
          payment_method: event.data.payment_method || 'pix',
          abacatepay_payment_id: event.data.payment_id || event.data.id,
          paid_at: new Date().toISOString(),
        })
        if (payError) {
          console.error('[WEBHOOK] Failed to insert payment:', payError.message)
        }

        // Allocate coupons via RPC
        const { error: couponError } = await supabase.rpc('allocate_coupons', {
          p_user_id: sub.user_id,
          p_subscription_id: sub.id,
          p_plan: sub.plan_type,
        })
        if (couponError) {
          console.error('[WEBHOOK] Failed to allocate coupons:', couponError.message)
        }

        // Send push notification (placeholder)
        await sendPush(supabase, sub.user_id, {
          title: 'Pagamento confirmado!',
          body: 'Seus cupons ja estao disponiveis.',
        })

        console.log(`[WEBHOOK] billing.paid processed for user ${sub.user_id}`)
        break
      }

      case 'subscription.cancelled': {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('abacatepay_subscription_id', event.data.subscription_id)

        if (error) {
          console.error('[WEBHOOK] Failed to cancel subscription:', error.message)
        }
        console.log(`[WEBHOOK] subscription.cancelled processed`)
        break
      }

      case 'subscription.failed': {
        // Update status to past_due
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('abacatepay_subscription_id', event.data.subscription_id)

        if (updateError) {
          console.error('[WEBHOOK] Failed to update to past_due:', updateError.message)
        }

        // Get user_id to send push notification
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('abacatepay_subscription_id', event.data.subscription_id)
          .single()

        if (sub) {
          await sendPush(supabase, sub.user_id, {
            title: 'Problema no pagamento',
            body: 'Atualize seu metodo de pagamento para continuar usando seus cupons.',
          })
        }

        console.log(`[WEBHOOK] subscription.failed processed`)
        break
      }

      default:
        console.warn(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`[WEBHOOK] Error processing ${event.type}:`, err)
    // Still return 200 to prevent webhook retries for unrecoverable errors
  }

  return new Response('OK', { status: 200 })
})
