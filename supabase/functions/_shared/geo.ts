// Utilidades geográficas
export const WALK_M_PER_MIN = 80 // ~4,8 km/h

export const walkMinutes = (distanceM: number) => Math.max(1, Math.round(distanceM / WALK_M_PER_MIN))

/** Distancia Haversine en metros (solo para mostrar; las validaciones van en PostGIS) */
export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
