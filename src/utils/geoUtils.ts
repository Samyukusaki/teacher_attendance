import { toKhmerNumber } from './khmerDate';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format distance in Khmer text (meters or kilometers).
 */
export function formatDistanceKhmer(meters: number): string {
  if (meters < 1000) {
    return `${toKhmerNumber(meters)} ម៉ែត្រ`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${toKhmerNumber(km)} គីឡូម៉ែត្រ`;
}

/**
 * Default GeoFence configuration for Bun Rany Hun Sen Prey Pon High School
 */
export const DEFAULT_GEOFENCE = {
  enabled: true,
  latitude: 11.5367, // Example Coordinates in Prey Veng / Prey Pon
  longitude: 105.2154,
  radiusMeters: 500, // 500 meters radius from school center
  requireLocation: true,
};
