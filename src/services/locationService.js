// src/services/locationService.js
import * as Location from 'expo-location';

/**
 * Devuelve { latitude, longitude }
 */
export async function getCurrentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error('LOCATION_PERMISSION_DENIED');
    err.code = 'LOCATION_PERMISSION_DENIED';
    throw err;
  }

  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

/**
 * Devuelve un string de dirección aproximada
 */
export async function reverseGeocode({ latitude, longitude }) {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!places || !places.length) return null;

    const p = places[0];
    const parts = [
      p.name,
      p.district,
      p.city,
      p.region,
      p.country,
    ].filter(Boolean);

    return parts.join(', ');
  } catch (e) {
    console.warn('[reverseGeocode]', e);
    return null;
  }
}

export const LocationService = {
  getCurrentCoords,
  reverseGeocode,
};
