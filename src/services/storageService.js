// src/services/storageService.js
import { app } from './firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

// instancia de storage desde la app que ya inicializamos
const storage = getStorage(app);

/**
 * Convierte una URI local de Expo (file://, content://) a un Blob
 * Firebase Storage en RN/Expo lo necesita así.
 */
async function uriToBlob(uri) {
  const res = await fetch(uri);
  const blob = await res.blob();
  return blob;
}

/**
 * Sube **un** archivo y devuelve la URL pública.
 * @param {string} uri - uri local (de cámara o galería)
 * @param {string} path - ruta en firebase storage, ej. `incidents/123/photo_0.jpg`
 */
export async function uploadFile(uri, path) {
  try {
    const blob = await uriToBlob(uri);
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (err) {
    console.log('[STORAGE UPLOAD ERROR]', err?.code, err?.message, err);
    throw err;
  }
}

/**
 * Sube varias URIs (fotos o videos) y devuelve sus URLs en el mismo orden.
 * @param {string[]} uris
 * @param {string} basePath
 */
export async function uploadMany(uris = [], basePath = 'incidents') {
  const results = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    // intentamos detectar extensión
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const path = `${basePath}/file_${Date.now()}_${i}.${ext}`;
    const url = await uploadFile(uri, path);
    results.push(url);
  }

  return results;
}
