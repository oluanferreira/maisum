import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * send-push — Edge Function for sending push notifications via Expo Push API
 *
 * Receives a POST body with:
 *   { user_id: string | string[], title: string, body: string, data?: Record<string, unknown> }
 *
 * Queries push_tokens for the given user_id(s), then sends notifications
 * to the Expo Push API in batches of up to 100 tokens.
 *
 * Returns: { success: number, failure: number }
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { user_id, title, body, data } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Support single user_id or array of user_ids
    const userIds = Array.isArray(user_id) ? user_id : [user_id]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Query push_tokens for the given user_ids
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)

    if (tokensError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens', details: tokensError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: 0, failure: 0, message: 'No push tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build Expo push messages
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
    }))

    // Send in batches of 100 (Expo API limit)
    const chunks = chunkArray(messages, 100)
    let successCount = 0
    let failureCount = 0

    const expoPushAccessToken = Deno.env.get('EXPO_PUSH_ACCESS_TOKEN')

    for (const chunk of chunks) {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (expoPushAccessToken) {
        headers['Authorization'] = `Bearer ${expoPushAccessToken}`
      }

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(chunk),
      })

      const result = await response.json()

      if (result.data && Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i]
          if (ticket.status === 'ok') {
            successCount++
          } else {
            failureCount++
            // Remove invalid tokens (DeviceNotRegistered)
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await supabase
                .from('push_tokens')
                .delete()
                .eq('token', chunk[i].to)
            }
          }
        }
      } else {
        // Entire batch failed
        failureCount += chunk.length
      }
    }

    return new Response(
      JSON.stringify({ success: successCount, failure: failureCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/** Split an array into chunks of the given size */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
