import { env } from '@/lib/env';
import {
  registerFallbackMockHandler,
  type MockHandler,
  type MockRequest,
} from '@/lib/api/mock-registry';
import type { Me, Movement, PreferencesPayload, Wallet } from '@/lib/api/schemas';
import { preferencesSchema } from '@/lib/api/schemas';

/**
 * MOCKS PROVISIONALES DE `me`, `wallet` Y `walletMovements` (para T5 y T6)
 *
 * Existen solo para poder construir Inicio y Billetera mientras no llegan los mocks de G0
 * (Gabriel) ni los contratos de David. Se registran como manejador de RESPALDO: cuando G0
 * registre el suyo con `registerMockHandler`, este deja de usarse solo y se puede borrar.
 *
 * Los datos cuentan la misma historia del prototipo. Los saldos de cada movimiento están
 * encadenados a mano para que cuadren (el frontend no calcula saldos, solo los muestra).
 */

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Fecha ISO de hace `dias` días a las `hora` en punto, para que los datos siempre parezcan recientes. */
function haceDias(dias: number, hora: number): string {
  const fecha = new Date(Date.now() - dias * DIA);
  fecha.setHours(hora, 0, 0, 0);
  return fecha.toISOString();
}

/** Respuesta de éxito con el sobre `{ data, error, meta }`. */
function ok(data: unknown) {
  return { data, error: null, meta: {} };
}

function fail(code: string, message: string) {
  return { data: null, error: { code, message }, meta: {} };
}

/** Pequeña espera para que se vean los estados de carga como con una red real. */
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SALDOS: Wallet = { credits: 120, cop: 85_000 };

/** Mutable: el onboarding (PATCH /preferences) actualiza estos campos. */
let ME: Me = {
  id: 'mock-user-1',
  displayName: 'Camila Rojas',
  email: 'camila@example.com',
  language: 'es',
  interests: [],
  accessibilityNeeds: [],
  worldCupMode: false,
  balances: SALDOS,
  availableBenefits: 2,
};

/** Del más reciente al más antiguo, como los entregaría el backend. */
const MOVIMIENTOS: Movement[] = [
  {
    id: 'm-3',
    kind: 'purchase',
    currency: 'COP',
    title: 'Compra en Arepas de huevo Doña Carmen',
    detail: '2 × Arepa de huevo',
    amount: -8_000,
    balanceAfter: 85_000,
    createdAt: haceDias(1, 13),
  },
  {
    id: 'm-2',
    kind: 'activity',
    currency: 'CC',
    title: 'Visita a la Catedral Metropolitana María Reina',
    detail: 'Participación registrada en el punto habilitado',
    amount: 20,
    balanceAfter: 120,
    createdAt: haceDias(2, 11),
  },
  {
    id: 'm-1',
    kind: 'activity',
    currency: 'CC',
    title: 'Visita a la Casa del Carnaval',
    detail: '25 base + 5 de bonificación de inclusión',
    amount: 30,
    balanceAfter: 100,
    createdAt: haceDias(3, 17),
  },
  {
    id: 'm-0',
    kind: 'redeem',
    currency: 'CC',
    title: 'Canje de bono en Artesanías del Caribe',
    detail: 'Bono QP-7K2M-91',
    amount: -200,
    balanceAfter: 70,
    createdAt: haceDias(4, 10),
  },
];

const handler: MockHandler = async ({ name, body }: MockRequest) => {
  await esperar(400);
  switch (name) {
    case 'me':
      return ok(ME);
    case 'updatePreferences': {
      const parsed = preferencesSchema.safeParse(body);
      if (!parsed.success) {
        return fail('invalid_body', 'Preferencias inválidas');
      }
      const next: PreferencesPayload = parsed.data;
      ME = {
        ...ME,
        language: next.language,
        interests: next.interests,
        accessibilityNeeds: next.accessibilityNeeds,
      };
      return ok(next);
    }
    case 'wallet':
      return ok(SALDOS);
    case 'walletMovements':
      return ok(MOVIMIENTOS);
    default:
      return fail('not_mocked', `El endpoint "${name}" aún no tiene mock (G0 lo agrega).`);
  }
};

/** Se llama una vez al arrancar. Solo hace algo si EXPO_PUBLIC_USE_MOCKS=true. */
export function registerTurriagoMocks(): void {
  if (!env.useMocks) return;
  registerFallbackMockHandler(handler);
}
