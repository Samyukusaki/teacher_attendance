import { useState, useEffect, useCallback } from 'react';
import { GeoFenceConfig } from '../types';
import { calculateDistanceInMeters } from '../utils/geoUtils';

export interface GeoLocationState {
  coords: { latitude: number; longitude: number; accuracy?: number } | null;
  distanceMeters: number | null;
  isInside: boolean | null;
  isLocating: boolean;
  error: string | null;
  lastCheckedAt: Date | null;
  isSimulated?: boolean;
}

export function useGeoLocation(geoFence?: GeoFenceConfig) {
  const [state, setState] = useState<GeoLocationState>({
    coords: null,
    distanceMeters: null,
    isInside: null,
    isLocating: false,
    error: null,
    lastCheckedAt: null,
    isSimulated: false,
  });

  const checkLocation = useCallback(async (): Promise<{
    success: boolean;
    isInside: boolean;
    distanceMeters: number | null;
    error?: string;
  }> => {
    if (!geoFence || !geoFence.enabled) {
      // If geofencing is not enabled in school settings, allow submission freely
      return { success: true, isInside: true, distanceMeters: 0 };
    }

    if (!navigator.geolocation) {
      const err = 'ឧបករណ៍ ឬ Browser របស់អ្នកមិនគាំទ្រប្រព័ន្ធកំណត់ទីតាំង GPS ទេ';
      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: err,
        isInside: false,
      }));
      return { success: false, isInside: false, distanceMeters: null, error: err };
    }

    setState((prev) => ({ ...prev, isLocating: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const distance = calculateDistanceInMeters(
            userLat,
            userLng,
            geoFence.latitude,
            geoFence.longitude
          );

          const isInside = distance <= geoFence.radiusMeters;

          const newState: GeoLocationState = {
            coords: { latitude: userLat, longitude: userLng, accuracy },
            distanceMeters: distance,
            isInside,
            isLocating: false,
            error: null,
            lastCheckedAt: new Date(),
            isSimulated: false,
          };

          setState(newState);
          resolve({ success: true, isInside, distanceMeters: distance });
        },
        (err) => {
          let errorMsg = 'មិនអាចចាប់យកទីតាំង GPS បានទេ';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'លោកអ្នកបានបដិសេធសិទ្ធិទីតាំង (Location Permission Denied)។ សូមអនុញ្ញាតសិទ្ធិ Location ក្នុងកម្មវិធីរុករក (Browser)។';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'ព័ត៌មានទីតាំង GPS មិនអាចទាញយកបាននៅពេលនេះទេ។';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'ការស្វែងរកទីតាំង GPS លើសម៉ោងកំណត់ (Timeout)។ សូមព្យាយាមម្តងទៀត។';
          }

          setState((prev) => ({
            ...prev,
            isLocating: false,
            error: errorMsg,
            isInside: false,
          }));
          resolve({ success: false, isInside: false, distanceMeters: null, error: errorMsg });
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }, [geoFence?.enabled, geoFence?.latitude, geoFence?.longitude, geoFence?.radiusMeters]);

  // Simulation helpers for testing or demo purposes
  const simulatePosition = (isInside: boolean) => {
    if (!geoFence) return;
    const distance = isInside ? 45 : geoFence.radiusMeters + 350;
    // slightly offset lat/lng
    const latOffset = isInside ? 0.0003 : 0.015;
    setState({
      coords: {
        latitude: geoFence.latitude + latOffset,
        longitude: geoFence.longitude + latOffset,
        accuracy: 10,
      },
      distanceMeters: distance,
      isInside,
      isLocating: false,
      error: null,
      lastCheckedAt: new Date(),
      isSimulated: true,
    });
  };

  // Automatically check location on first mount if geofence is enabled
  useEffect(() => {
    if (geoFence && geoFence.enabled) {
      checkLocation();
    }
  }, [geoFence?.enabled, geoFence?.latitude, geoFence?.longitude]);

  return {
    ...state,
    checkLocation,
    simulatePosition,
  };
}
