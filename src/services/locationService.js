// src/services/locationService.js
import * as Location from 'expo-location';

/** Solicita permisos y devuelve coordenadas actuales */
export async function getCurrentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error('Permiso de ubicación denegado');
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

/** ✅ Reverse Geocoding: obtiene nombre del lugar a partir de coordenadas */
export async function reverseGeocode({ latitude, longitude }) {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!places || !places.length) return null;

    const place = places[0];
    const parts = [
      place.name,      // ej: “Parque de Belén”
      place.district,  // ej: “Belén”
      place.city,      // ej: “Medellín”
      place.region,    // ej: “Antioquia”
      place.country,   // ej: “Colombia”
    ].filter(Boolean);

    return parts.join(', ');
  } catch (e) {
    console.error('[reverseGeocode]', e);
    return null;
  }
}
