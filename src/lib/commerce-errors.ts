import { ApiError, ClientErrorCode, isApiError } from '@/lib/api/errors';
import { CommerceErrorCode } from '@/lib/api/schemas-commerce';
import { formatCop, formatCredits } from '@/lib/format';

/**
 * Errores de las pantallas de Gabriel (check-in, canje, QR, compra, Precio Justo)
 * traducidos a texto para la persona. NUNCA se muestra `error.message` (es técnico).
 *
 * Cuando exista el mapeo general de T7 (Turriago), lo genérico (red, sesión) puede salir
 * de allá; los códigos de negocio de estos flujos siguen aquí porque usan `details`.
 */

/** Fallo de ubicación del dispositivo (antes de llamar al backend). */
export class LocationReadError extends Error {
  constructor(
    readonly code: 'permission_denied' | 'services_disabled' | 'location_timeout' | 'location_unavailable',
    /** Solo para `permission_denied`: false = hay que ir a Ajustes. */
    readonly canAskAgain = true,
  ) {
    super(code);
    this.name = 'LocationReadError';
  }
}

export type ErrorAction = 'retry' | 'settings' | 'directions' | 'wallet' | 'benefits' | 'refresh';

export type FriendlyError = {
  title: string;
  message: string;
  /** Qué botón ofrecer, además de volver. */
  action?: ErrorAction;
  /** El resultado es incierto: reintentar con la MISMA llave es seguro. */
  transient: boolean;
};

/** Sin respuesta, tiempo agotado o error del servidor: no sabemos si se aplicó. */
export function isTransientError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.code === ClientErrorCode.Network || error.code === ClientErrorCode.Timeout) return true;
  return error.code === ClientErrorCode.Http && error.status >= 500;
}

function detail<T>(error: ApiError, key: string): T | undefined {
  const details = error.details;
  if (details && typeof details === 'object' && key in details) {
    return (details as Record<string, T>)[key];
  }
  return undefined;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(meters)} m`;
}

export function describeError(error: unknown): FriendlyError {
  if (error instanceof LocationReadError) {
    switch (error.code) {
      case 'permission_denied':
        return {
          title: 'Necesitamos tu ubicación',
          message: error.canAskAgain
            ? 'Para registrar tu participación tenemos que confirmar que estás en el punto habilitado. Solo la usamos en este momento.'
            : 'El permiso de ubicación está desactivado para QuillaPass. Actívalo en Ajustes y vuelve a intentarlo.',
          action: error.canAskAgain ? 'retry' : 'settings',
          transient: false,
        };
      case 'services_disabled':
        return {
          title: 'La ubicación del teléfono está apagada',
          message: 'Activa la ubicación (GPS) del teléfono y vuelve a intentarlo.',
          action: 'settings',
          transient: false,
        };
      case 'location_timeout':
        return {
          title: 'No logramos ubicarte a tiempo',
          message: 'Sal a un espacio abierto, lejos de techos altos, y vuelve a intentarlo.',
          action: 'retry',
          transient: false,
        };
      default:
        return {
          title: 'No pudimos leer tu ubicación',
          message: 'Revisa que la ubicación esté activa y vuelve a intentarlo.',
          action: 'retry',
          transient: false,
        };
    }
  }

  if (!isApiError(error)) {
    return { title: 'Algo salió mal', message: 'Inténtalo de nuevo en un momento.', action: 'retry', transient: false };
  }

  if (isTransientError(error)) {
    return {
      title: 'Sin confirmación del servidor',
      message:
        'La conexión falló y no sabemos si la operación alcanzó a registrarse. Reintenta: usamos el mismo identificador, así que no se cobrará ni acreditará dos veces.',
      action: 'retry',
      transient: true,
    };
  }

  switch (error.code) {
    case CommerceErrorCode.TooFar: {
      const distance = detail<number>(error, 'distanceM');
      const radius = detail<number>(error, 'radiusM');
      return {
        title: 'Estás lejos del punto habilitado',
        message:
          distance !== undefined && radius !== undefined
            ? `Estás a ${formatDistance(distance)} del punto. Acércate a menos de ${formatDistance(radius)} y vuelve a intentarlo.`
            : 'Acércate al punto habilitado y vuelve a intentarlo.',
        action: 'directions',
        transient: false,
      };
    }
    case CommerceErrorCode.LowAccuracy: {
      const accuracy = detail<number>(error, 'accuracyM');
      const max = detail<number>(error, 'maxAccuracyM') ?? 50;
      return {
        title: 'Tu GPS no es lo bastante preciso',
        message: `${accuracy !== undefined ? `Tu ubicación tiene un margen de ${Math.round(accuracy)} m y necesitamos ${max} m o menos. ` : ''}Sal a un espacio abierto, activa la ubicación precisa y vuelve a intentarlo.`,
        action: 'retry',
        transient: false,
      };
    }
    case CommerceErrorCode.MockLocation:
      return {
        title: 'Detectamos una ubicación simulada',
        message: 'Desactiva las apps que cambian tu ubicación o el modo de ubicación ficticia y vuelve a intentarlo.',
        transient: false,
      };
    case CommerceErrorCode.AlreadyCheckedIn:
      return {
        title: 'Ya registraste esta participación',
        message: 'Los créditos de esta actividad ya están en tu billetera.',
        action: 'wallet',
        transient: false,
      };
    case CommerceErrorCode.ActivityNotActive:
      return {
        title: 'La actividad no está vigente',
        message: 'Solo puedes registrar tu participación mientras la actividad está abierta.',
        transient: false,
      };
    case CommerceErrorCode.InsufficientCredits: {
      const missing = detail<number>(error, 'missing');
      return {
        title: 'Te faltan créditos',
        message:
          missing !== undefined
            ? `Te faltan ${formatCredits(missing)} CC para este bono. Participa en actividades para sumar más.`
            : 'No tienes créditos suficientes para este bono.',
        transient: false,
      };
    }
    case CommerceErrorCode.OutOfStock:
      return {
        title: 'Este bono se agotó',
        message: 'Alguien canjeó el último. Mira otros bonos disponibles.',
        action: 'benefits',
        transient: false,
      };
    case CommerceErrorCode.RedeemLimitReached:
      return {
        title: 'Ya alcanzaste el límite',
        message: 'Canjeaste este bono todas las veces permitidas por persona.',
        transient: false,
      };
    case CommerceErrorCode.BenefitExpired:
      return { title: 'El bono ya no está vigente', message: 'Mira otros bonos disponibles.', action: 'benefits', transient: false };
    case CommerceErrorCode.InvalidQr:
      return {
        title: 'Este QR no es de un comercio de QuillaPass',
        message: 'Escanea el código que muestra el comercio en su caja o pídele que te lo muestre de nuevo.',
        action: 'retry',
        transient: false,
      };
    case CommerceErrorCode.MerchantInactive:
      return { title: 'Comercio no disponible', message: 'Este comercio no está recibiendo pagos ahora.', transient: false };
    case CommerceErrorCode.InsufficientBalance: {
      const shortfall = detail<number>(error, 'shortfallCop');
      return {
        title: 'Saldo insuficiente',
        message:
          shortfall !== undefined
            ? `Te faltan ${formatCop(shortfall)} para completar la compra. Quita productos o aplica un bono.`
            : 'Tu saldo no alcanza. Quita productos o aplica un bono.',
        transient: false,
      };
    }
    case CommerceErrorCode.CheckoutExpired:
      return {
        title: 'El resumen de la compra venció',
        message: 'Actualizamos los precios y el saldo. Revisa el total y confirma de nuevo.',
        action: 'refresh',
        transient: false,
      };
    case CommerceErrorCode.VoucherNotApplicable:
      return {
        title: 'El bono no aplica',
        message: 'Ese bono no se puede usar en esta compra o ya fue usado. Elige otro o paga sin bono.',
        action: 'refresh',
        transient: false,
      };
    case CommerceErrorCode.PriceReferenceUnavailable:
      return {
        title: 'Sin referencia de precio',
        message: 'Todavía no tenemos precios de este producto en la zona.',
        transient: false,
      };
    case CommerceErrorCode.NotFound:
      return { title: 'No encontramos esto', message: 'Puede que ya no esté disponible.', transient: false };
    default:
      return { title: 'Algo salió mal', message: 'Inténtalo de nuevo en un momento.', action: 'retry', transient: false };
  }
}
