// src/services/firestoreService.js
import { app } from './firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { currentUser } from './authService';

const db = getFirestore(app);

// guardar reporte
export async function saveReport(data = {}) {
  const user = currentUser();

  const payload = {
    description: data.description || '',
    address: data.address || '',
    location: data.location || null,
    category: data.category || null,
    subcategory: data.subcategory || null,
    photoUrl: data.photoUrl || '',
    photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
    videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : [],
    userId: user?.uid || data.userId || null,
    userEmail: user?.email || data.userEmail || null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'incidents'), payload);
  return { id: ref.id, ...payload };
}

// todos los reportes
export async function getAllReports() {
  const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// solo mis reportes
export async function getUserReports(userId) {
  const q = query(
    collection(db, 'incidents'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// eliminar
export async function deleteIncidentDoc(id) {
  await deleteDoc(doc(db, 'incidents', id));
}

// suscripción realtime (mapa, lista)
export function subscribeIncidents({ scope = 'all', userId, onData, onError } = {}) {
  let q;
  if (scope === 'mine' && userId) {
    q = query(
      collection(db, 'incidents'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData?.(rows);
    },
    (err) => {
      console.error('[subscribeIncidents error]', err);
      onError?.(err);
    }
  );
}
