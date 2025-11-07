// src/services/mediaService.js
import * as ImagePicker from 'expo-image-picker';

/**
 * Pide permiso y devuelve true/false
 */
async function ensurePermission(getFn, requestFn) {
  const current = await getFn();
  if (current.granted) return true;
  const req = await requestFn();
  return !!req.granted;
}

/**
 * Tomar foto con la cámara
 */
export async function takePhoto() {
  const ok = await ensurePermission(
    ImagePicker.getCameraPermissionsAsync,
    ImagePicker.requestCameraPermissionsAsync
  );
  if (!ok) {
    throw new Error('CAMERA_PERMISSION_DENIED');
  }

  const res = await ImagePicker.launchCameraAsync({
    // 👇 usamos la API vieja porque la tuya es la que tienes instalada
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (res.canceled) return null;
  const asset = res.assets?.[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

/**
 * Elegir foto de la galería
 */
export async function pickImage() {
  const ok = await ensurePermission(
    ImagePicker.getMediaLibraryPermissionsAsync,
    ImagePicker.requestMediaLibraryPermissionsAsync
  );
  if (!ok) {
    throw new Error('LIBRARY_PERMISSION_DENIED');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (res.canceled) return null;
  const asset = res.assets?.[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

/**
 * Elegir video de la galería
 */
export async function pickVideo() {
  const ok = await ensurePermission(
    ImagePicker.getMediaLibraryPermissionsAsync,
    ImagePicker.requestMediaLibraryPermissionsAsync
  );
  if (!ok) {
    throw new Error('LIBRARY_PERMISSION_DENIED');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 1,
  });

  if (res.canceled) return null;
  const asset = res.assets?.[0];
  return asset ? { uri: asset.uri, duration: asset.duration } : null;
}
