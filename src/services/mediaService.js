import * as ImagePicker from 'expo-image-picker';

/* Detecta si la versión soporta la API nueva (MediaType) o la antigua (MediaTypeOptions) */
function mediaTypesImage() {
  // SDK nueva (>= 51 aprox.): usa array con ImagePicker.MediaType.image
  if (ImagePicker?.MediaType?.image) return [ImagePicker.MediaType.image];
  // SDK antigua: usa enum ImagePicker.MediaTypeOptions.Images
  if (ImagePicker?.MediaTypeOptions?.Images != null) return ImagePicker.MediaTypeOptions.Images;
  // Fallback ultra defensivo
  return ImagePicker.MediaTypeOptions?.Images ?? undefined;
}

/* Utilidad genérica para verificar o solicitar permisos. */
async function ensure(permissionFn, getFn) {
  const current = await getFn();
  if (current.granted) {
    return { granted: true, canAskAgain: current.canAskAgain !== false };
  }
  const req = await permissionFn();
  return { granted: req.granted, canAskAgain: req.canAskAgain !== false, status: req.status };
}

/* Permiso para cámara */
export async function ensureCameraPermission() {
  return ensure(
    () => ImagePicker.requestCameraPermissionsAsync(),
    () => ImagePicker.getCameraPermissionsAsync()
  );
}

/* Permiso para galería */
export async function ensureLibraryPermission() {
  return ensure(
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    () => ImagePicker.getMediaLibraryPermissionsAsync()
  );
}

/* Tomar una foto con la cámara */
export async function takePhoto() {
  const perm = await ensureCameraPermission();
  if (!perm.granted) {
    const err = new Error('Permiso de cámara denegado');
    err.code = 'CAMERA_PERMISSION_DENIED';
    err.canAskAgain = perm.canAskAgain;
    throw err;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      exif: false,
      mediaTypes: mediaTypesImage(), 
    });
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
  } catch (e) {
    const err = new Error(`CAMERA_LAUNCH_FAILED: ${e?.message ?? 'unknown'}`);
    err.code = 'CAMERA_LAUNCH_FAILED';
    throw err;
  }
}

/* Escoger imagen de la galería */
export async function pickImage() {
  const perm = await ensureLibraryPermission();
  if (!perm.granted) {
    const err = new Error('Permiso de galería denegado');
    err.code = 'LIBRARY_PERMISSION_DENIED';
    err.canAskAgain = perm.canAskAgain;
    throw err;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      exif: false,
      mediaTypes: mediaTypesImage(), 
    });
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
  } catch (e) {
    const err = new Error(`LIBRARY_LAUNCH_FAILED: ${e?.message ?? 'unknown'}`);
    err.code = 'LIBRARY_LAUNCH_FAILED';
    throw err;
  }
}
