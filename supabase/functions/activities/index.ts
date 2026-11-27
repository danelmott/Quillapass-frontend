// V4 · GET /activities/{id} · POST /activities/{id}/check-in (Idempotency-Key)
import { createApp, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { fail, ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { withIdempotency } from '../_shared/idempotency.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import { logSecurityEvent } from '../_shared/security.ts'
import { CheckInRequest } from '../_shared/contracts/activities.ts'

const MIN_ACCURACY_M = 50
const app = createApp('/activities')
app.use('*', requireUser)

app.get('/:id', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_preview_activity_credits', {
    p_user_id: c.get('userId'), p_activity_id: id, p_lang: c.get('lang'),
  })
  if (err) return err
  return ok(c, data)
})

app.post('/:id/check-in', async (c) => {
  const [activityId, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const raw = await readJson(c)
  const [body, invalid] = parseWith(c, CheckInRequest, raw)
  if (invalid) return invalid
  const { location, qr_token } = body
  const userId = c.get('userId')!

  // Rechazos previos: no llegan a SQL
  if (location.is_mocked) {
    await logSecurityEvent(c.get('admin'), userId, 'mocked_location', { activity_id: activityId, accuracy_m: location.accuracy_m })
    return fail(c, 'LOCATION_SUSPICIOUS')
  }
  if (location.accuracy_m > MIN_ACCURACY_M) {
    return fail(c, 'LOCATION_ACCURACY_LOW', { accuracy_m: location.accuracy_m, max_accuracy_m: MIN_ACCURACY_M })
  }

  const limited = await rateLimit(c, 'checkin', 10, 60)
  if (limited) return limited

  return withIdempotency(c, `checkin:${activityId}`, raw, async (idemKey) => {
    const [data, err] = await rpc(c, 'fn_checkin_activity', {
      p_user_id: userId,
      p_activity_id: activityId,
      p_lat: location.lat,
      p_lng: location.lng,
      p_accuracy_m: location.accuracy_m,
      p_qr_token: qr_token ?? null,
      p_idempotency_key: idemKey,
    })
    if (err) return err
    return ok(c, data, 201)
  })
})

Deno.serve(app.fetch)
