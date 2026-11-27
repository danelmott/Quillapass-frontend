// Variables de entorno de Supabase Edge Functions (llaves nuevas con respaldo a las legadas)
function pickKey(jsonVar: string, legacyVar: string): string {
  const raw = Deno.env.get(jsonVar)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>
      const value = parsed.default ?? Object.values(parsed)[0]
      if (value) return value
    } catch {
      // formato inesperado: se usa la llave legada
    }
  }
  const legacy = Deno.env.get(legacyVar)
  if (!legacy) throw new Error(`Falta ${jsonVar} o ${legacyVar}`)
  return legacy
}

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
export const secretKey = () => pickKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
