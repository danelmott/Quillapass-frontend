// V10 · Genera los PNG de los QR de cobro de los comercios sembrados.
// 1) Exportar los payloads:
//    npx supabase db query --remote --output-format json \
//      "select p.name, (public.fn_merchant_qr(p.id)) ->> 'payload' as payload from public.places p where p.kind = 'comercio'" \
//      > /tmp/qr.json
// 2) Generar:  npm i --no-save qrcode && node supabase/scripts/gen-qr.mjs /tmp/qr.json [carpeta_salida]
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const input = process.argv[2]
if (!input) {
  console.error('Uso: node gen-qr.mjs <archivo.json con [{name, payload}]> [carpeta_salida]')
  process.exit(1)
}
const raw = JSON.parse(readFileSync(input, 'utf8'))
const rows = Array.isArray(raw) ? raw : (raw.rows ?? raw.result ?? [])
const outDir = process.argv[3] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'demo-qr')
mkdirSync(outDir, { recursive: true })

for (const { name, payload } of rows) {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const file = join(outDir, `${slug}.png`)
  await QRCode.toFile(file, payload, { width: 720, margin: 2, errorCorrectionLevel: 'M' })
  console.log(`${file}  <- ${name}`)
}
