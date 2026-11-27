// audit.security_events: ubicación simulada, saltos imposibles, abusos
import type { SupabaseClient } from '@supabase/supabase-js'

export async function logSecurityEvent(
  admin: SupabaseClient,
  userId: string | null,
  eventType: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.rpc('fn_log_security_event', {
    p_user_id: userId,
    p_event_type: eventType,
    p_details: details,
  })
  if (error) console.error(JSON.stringify({ level: 'warn', security_event_error: error.message }))
}
