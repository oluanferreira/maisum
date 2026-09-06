import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ATTEMPTS = 5

type QueueItem = {
  id: string
  campaign_id: string
  user_id: string
  destination: string
  subject: string
  preview_text: string | null
  html_body: string
  attempts: number
}

function getAdminKey() {
  return Deno.env.get('MAISUM_SUPABASE_SECRET_KEY')
    ?? Deno.env.get('SUPABASE_SECRET_KEY')
    ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return diff === 0
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const dispatchSecret = Deno.env.get('CRM_EMAIL_DISPATCH_SECRET')
  const providedSecret = req.headers.get('x-maisum-crm-secret') ?? ''
  if (!dispatchSecret || !safeEqual(dispatchSecret, providedSecret)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('CRM_EMAIL_FROM') ?? Deno.env.get('OFFER_EMAIL_FROM')
  const adminKey = getAdminKey()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')

  if (!resendKey || !from || !adminKey || !supabaseUrl) {
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, adminKey)
  const { data, error } = await supabase.rpc('claim_due_crm_emails', { p_limit: 50 })
  if (error) {
    console.error('[CRM_EMAIL] claim failed:', error.message)
    return Response.json({ ok: false, error: 'claim_failed' }, { status: 500 })
  }

  const items = (data ?? []) as QueueItem[]
  const campaignIds = new Set<string>()
  let sent = 0
  let failed = 0

  for (const item of items) {
    campaignIds.add(item.campaign_id)
    await supabase.from('crm_email_campaigns').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', item.campaign_id)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [item.destination],
        subject: item.subject,
        html: withPreview(item.html_body, item.preview_text),
        headers: {
          'List-Unsubscribe': '<https://app.appmaisum.com.br/profile/edit>',
        },
      }),
    }).catch(() => null)

    if (response?.ok) {
      const provider = await response.json().catch(() => ({})) as { id?: string }
      sent += 1
      const now = new Date().toISOString()
      await supabase.from('crm_email_outbox').update({
        status: 'sent',
        sent_at: now,
        provider_message_id: provider.id ?? null,
        last_error: null,
      }).eq('id', item.id)
      await supabase.from('crm_contacts').update({ last_email_sent_at: now, updated_at: now }).eq('user_id', item.user_id)
      await supabase.from('crm_contact_events').insert({
        user_id: item.user_id,
        channel: 'email',
        event_type: 'email_sent',
        metadata: { campaign_id: item.campaign_id, provider_message_id: provider.id ?? null },
      })
      continue
    }

    failed += 1
    const detail = response ? await response.text().catch(() => '') : 'network_error'
    const retryable = !response || response.status === 429 || response.status >= 500
    const retry = retryable && item.attempts < MAX_ATTEMPTS
    await supabase.from('crm_email_outbox').update({
      status: retry ? 'pending' : 'failed',
      scheduled_at: retry ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : new Date().toISOString(),
      last_error: `resend_${response?.status ?? 'network'}:${detail}`.slice(0, 500),
    }).eq('id', item.id)
  }

  for (const campaignId of campaignIds) {
    const { count: remaining } = await supabase
      .from('crm_email_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'processing'])

    if ((remaining ?? 0) === 0) {
      await supabase.from('crm_email_campaigns').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', campaignId)
    }
  }

  return Response.json({ ok: true, claimed: items.length, sent, failed })
})

function withPreview(html: string, preview: string | null) {
  if (!preview) return html
  const hidden = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preview)}</div>`
  return html.replace(/<body([^>]*)>/i, `<body$1>${hidden}`)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
