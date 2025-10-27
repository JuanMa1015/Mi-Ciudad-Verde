// src/services/realtimeIncidents.js
import { firebaseApp } from './firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

/**
 * Suscribe en tiempo real a incidentes.
 * @param {'all'|'mine'} scope  - 'all' = públicos; 'mine' = del usuario.
 * @param {string} [userId]     - requerido si scope='mine'
 * @param {(rows: Array<any>) => void} onData
 * @param {(err: any) => void} onError
 * @returns {() => void} unsubscribe
 */
export function subscribeIncidents({ scope = 'all', userId, onData, onError }) {
  const db = getFirestore(firebaseApp);
  const col = collection(db, 'incidents');

  let q;
  if (scope === 'mine' && userId) {
    // Requiere índice compuesto: userId ASC + createdAt DESC (ya creado)
    q = query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    q = query(col, orderBy('createdAt', 'desc'));
  }

  // includeMetadataChanges para ignorar cambios locales (pending writes)
  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const rows = [];
      snap.forEach((doc) => {
        const d = doc.data();
        rows.push({
          id: doc.id,
          description: d.description || '',
          location: d.location || { latitude: 0, longitude: 0 },
          photoUrl: d.photoUrl || '',
          createdAt: d.createdAt?.toMillis?.() ?? d.createdAt ?? Date.now(),
          userId: d.userId || '',
          _hasPendingWrites: doc.metadata.hasPendingWrites,
          _fromCache: doc.metadata.fromCache,
        });
      });
      // Opcional: filtra writes optimistas si no quieres verlos hasta confirmar
      const confirmed = rows.filter((r) => !r._hasPendingWrites);
      onData(confirmed);
    },
    (err) => {
      console.error('[Realtime subscribeIncidents]', err);
      onError?.(err);
    }
  );

  return unsubscribe;
}
