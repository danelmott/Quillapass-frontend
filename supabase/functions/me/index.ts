// V2 · GET /me · PATCH /me/preferences
import { createApp } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { fail, ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { PatchPreferencesRequest } from '../_shared/contracts/me.ts'

const app = createApp('/me')

app.get('/', requireUser, async (c) => {
  const [data, err] = await rpc(c, 'fn_home_summary', { p_user_id: c.get('userId') })
  if (err) return err
  if (!data) return fail(c, 'NOT_FOUND')
  return ok(c, data)
})

app.patch('/preferences', requireUser, async (c) => {
  const [body, bad] = parseWith(c, PatchPreferencesRequest, await readJson(c))
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_update_preferences', { p_user_id: c.get('userId'), p: body })
  if (err) return err
  return ok(c, data)
})

Deno.serve(app.fetch)
