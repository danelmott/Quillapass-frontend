// POST /account/signup: crea la cuenta ya confirmada (correo + contraseña).
// El correo integrado de Supabase tiene un tope por hora para todo el proyecto, así que el
// registro no depende de él. Después la app entra con signInWithPassword; handle_new_user
// crea el perfil, las cuentas del ledger y la bienvenida.
import { createApp } from '../_shared/app.ts'
import { optionalUser } from '../_shared/auth.ts'
import { fail, ok, parseWith, readJson } from '../_shared/http.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import { SignUpRequest } from '../_shared/contracts/account.ts'

const app = createApp('/account')
app.use('*', optionalUser)

app.post('/signup', async (c) => {
  const [body, bad] = parseWith(c, SignUpRequest, await readJson(c))
  if (bad) return bad

  const ip = (c.req.header('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const limited = await rateLimit(c, `signup:${ip}`, 10, 3600)
  if (limited) return limited

  const { data, error } = await c.get('admin').auth.admin.createUser({
    email: body.email.trim().toLowerCase(),
    password: body.password,
    email_confirm: true,
    user_metadata: {
      ...(body.display_name ? { display_name: body.display_name } : {}),
      language: body.language ?? c.get('lang'),
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (error.code === 'email_exists' || msg.includes('already been registered') || msg.includes('already registered')) {
      return fail(c, 'EMAIL_TAKEN')
    }
    if (error.code === 'weak_password' || msg.includes('password')) {
      return fail(c, 'VALIDATION_ERROR', { field: 'password' })
    }
    if (error.code === 'email_address_invalid' || msg.includes('email')) {
      return fail(c, 'VALIDATION_ERROR', { field: 'email' })
    }
    console.error(JSON.stringify({ level: 'error', request_id: c.get('requestId'), signup_error: error.message }))
    return fail(c, 'INTERNAL_ERROR')
  }

  return ok(c, { user_id: data.user.id }, 201)
})

Deno.serve(app.fetch)
