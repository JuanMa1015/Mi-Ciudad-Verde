import * as FileSystem from 'expo-file-system';
import { firebaseApp } from './firebase/app';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';

function guessContentType(uri) {
  const lower = String(uri).toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg'; // por defecto
}

/**
 * Sube una imagen local (file:// o content://) a Firebase Storage en base64
 * y devuelve el downloadURL. Mucho más estable en Expo que fetch(...).blob().
 */
// export async function uploadIncidentPhoto(localUri, { userId = 'guest', incidentId }) {
//   if (!localUri) return '';

//   const storage = getStorage(firebaseApp);
//   const safeUser = userId || 'guest';
//   const safeId = incidentId || Date.now().toString();

//   const ext = (localUri.split('.').pop() || 'jpg').replace(/\?.*$/, '');
//   const path = `incidents/${safeUser}/${safeId}.${ext}`;
//   const storageRef = ref(storage, path);

//   // Lee como base64 (funciona para file:// y content:// en Android)
//   const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
//   const contentType = guessContentType(localUri);

//   // Sube base64
//   await uploadString(storageRef, base64, 'base64', { contentType });

//   // URL de descarga
//   const downloadURL = await getDownloadURL(storageRef);
//   return downloadURL;
// }

// No-op mientras USE_STORAGE=false. Así no rompes imports existentes.
export async function uploadIncidentPhoto(localUri, { userId = 'guest', incidentId }) {
  // Devuelve cadena vacía para que Firestore guarde photoUrl: ''
  return '';
}
