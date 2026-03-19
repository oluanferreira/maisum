import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * expire-coupons — Cron Edge Function (placeholder)
 *
 * This function should be triggered daily via pg_cron or Supabase Scheduled Functions.
 * Recommended cron: 0 0 * * * (midnight daily)
 *
 * Setup options:
 * 1. Supabase Dashboard > Database > Extensions > pg_cron
 *    SELECT cron.schedule('expire-coupons', '0 0 * * *',
 *      $$UPDATE coupons SET status = 'expired' WHERE status = 'available' AND expires_at < now()$$
 *    );
 *
 * 2. Or call this Edge Function from an external cron service (e.g., cron-job.org)
 *    POST https://<project>.supabase.co/functions/v1/expire-coupons
 *    Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 */

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Create admin Supabase client (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date().toISOString()

  // 1. Expire available coupons past their expiration date
  const { data: expiredCoupons, error: couponError } = await supabase
    .from('coupons')
    .update({ status: 'expired' })
    .eq('status', 'available')
    .lt('expires_at', now)
    .select('id')

  if (couponError) {
    console.error('[EXPIRE-COUPONS] Error expiring coupons:', couponError.message)
    return new Response(
      JSON.stringify({ error: couponError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const couponsExpiredCount = expiredCoupons?.length ?? 0

  // 2. Expire cancelled subscriptions past their period end
  const { data: expiredSubs, error: subError } = await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'cancelled')
    .lt('current_period_end', now)
    .select('id')

  if (subError) {
    console.error('[EXPIRE-COUPONS] Error expiring subscriptions:', subError.message)
  }

  const subsExpiredCount = expiredSubs?.length ?? 0

  console.log(
    `[EXPIRE-COUPONS] Run at ${now}: ${couponsExpiredCount} coupons expired, ${subsExpiredCount} subscriptions expired`,
  )

  return new Response(
    JSON.stringify({
      success: true,
      timestamp: now,
      coupons_expired: couponsExpiredCount,
      subscriptions_expired: subsExpiredCount,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
