// src/services/firestoreService.js
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './firebase/app';

const db = getFirestore(app);

/* =========================================================
 * USERS
 * =======================================================*/
export async function createUserDoc({ uid, email, displayName = '', role = 'user' }) {
  if (!uid) return;
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      email: email || '',
      displayName: displayName || '',
      role,
    },
    { merge: true }
  );
}

export async function getUserRole(uid) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().role || null;
}

export async function getUserById(uid) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Realtime al doc del usuario (para rol en vivo) */
export function subscribeUserDoc(uid, onNext, onError) {
  if (!uid) return () => {};
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, onNext, onError);
}

/* =========================================================
 * INCIDENTS
 * =======================================================*/
export async function saveReport(data = {}) {
  const ref = collection(db, 'incidents');

  const payload = {
    description: data.description || '',
    address: data.address || '',
    location: data.location || null,
    photoUrl: data.photoUrl || '',
    photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
    videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : [],
    category: data.category || '',
    subcategory: data.subcategory || '',
    userId: data.userId || null,
    userEmail: data.userEmail || null,
    createdAt: data.createdAt || new Date(),
    status: data.status || 'nuevo',
    assignedDept: data.assignedDept || null,
    assignedDeptId: data.assignedDeptId || null,
    assignedUnit: data.assignedUnit || null,
    assignedUnitId: data.assignedUnitId || null,
    assignedAt: data.assignedAt || null,
    assignedBy: data.assignedBy || null,
  };

  await addDoc(ref, payload);
}

export function subscribeIncidents({ scope = 'all', userId, onData, onError }) {
  try {
    const base = collection(db, 'incidents');
    let qRef;

    if (scope === 'mine' && userId) {
      qRef = query(base, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      qRef = query(base, orderBy('createdAt', 'desc'));
    }

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        onData?.(rows);
      },
      (err) => onError?.(err)
    );
  } catch (err) {
    onError?.(err);
    return () => {};
  }
}

export async function deleteIncidentDoc(id) {
  const ref = doc(db, 'incidents', id);
  await deleteDoc(ref);
}

export async function updateIncidentDoc(id, data) {
  const ref = doc(db, 'incidents', id);
  await updateDoc(ref, data);
}

/** Asignación desde admin */
export async function assignIncidentTo(id, { deptId, deptName, unitId, unitName, adminEmail }) {
  const ref = doc(db, 'incidents', id);
  await updateDoc(ref, {
    assignedDept: deptName || deptId || null,
    assignedDeptId: deptId || null,
    assignedUnit: unitName || unitId || null,
    assignedUnitId: unitId || null,
    assignedAt: serverTimestamp(),
    assignedBy: adminEmail || null,
    status: 'asignado',
  });
}

/* =========================================================
 * DEPARTMENTS / UNITS  (Catálogo real Medellín/Colombia)
 * =======================================================*/

/**
 * Catálogo base (se "siembra" en Firestore si está vacío)
 * Ids estables, nombres visibles en UI
 */
const DEFAULT_DEPARTMENTS = [
  {
    id: 'aseo_emvarias',
    name: 'Emvarias (Aseo Medellín)',
    icon: 'trash',
    defaultUnits: [
      { id: 'zona-centro', name: 'Zona Centro' },
      { id: 'zona-norte', name: 'Zona Norte' },
      { id: 'zona-sur', name: 'Zona Sur' },
      { id: 'zona-occidente', name: 'Zona Occidente' },
    ],
  },
  {
    id: 'epm_aguas',
    name: 'EPM Aguas (Acueducto y Alcantarillado)',
    icon: 'water',
    defaultUnits: [
      { id: 'circuito-norte', name: 'Circuito Norte' },
      { id: 'circuito-sur', name: 'Circuito Sur' },
      { id: 'circuito-centro', name: 'Circuito Centro' },
    ],
  },
  {
    id: 'movilidad_medellin',
    name: 'Secretaría de Movilidad de Medellín',
    icon: 'car',
    defaultUnits: [
      { id: 'cuadrante-1', name: 'Cuadrante 1' },
      { id: 'cuadrante-2', name: 'Cuadrante 2' },
      { id: 'cuadrante-3', name: 'Cuadrante 3' },
      { id: 'agentes-apoyo', name: 'Agentes de apoyo' },
    ],
  },
  {
    id: 'dagrd_bomberos',
    name: 'DAGRD / Bomberos Medellín',
    icon: 'flame',
    defaultUnits: [
      { id: 'estacion-1', name: 'Estación 1' },
      { id: 'estacion-2', name: 'Estación 2' },
      { id: 'estacion-3', name: 'Estación 3' },
    ],
  },
  {
    id: 'medio_ambiente',
    name: 'Secretaría de Medio Ambiente (Medellín)',
    icon: 'leaf',
    defaultUnits: [
      { id: 'flora-arbolado', name: 'Flora y Arbolado' },
      { id: 'fauna', name: 'Fauna y Protección Animal' },
      { id: 'control-ruido', name: 'Control de Ruido' },
    ],
  },
  {
    id: 'amva_area_metropolitana',
    name: 'Área Metropolitana del Valle de Aburrá (AMVA)',
    icon: 'globe',
    defaultUnits: [
      { id: 'calidad-aire', name: 'Calidad del Aire' },
      { id: 'ruido-urbano', name: 'Ruido Urbano' },
    ],
  },
];

/** Semilla inicial si /departments está vacío */
async function seedDepartmentsIfEmpty() {
  const colRef = collection(db, 'departments');
  const snap = await getDocs(colRef);
  if (!snap.empty) return;

  // Crear docs de departamentos + subcolección de units
  await Promise.all(
    DEFAULT_DEPARTMENTS.map(async (dept) => {
      await setDoc(doc(db, 'departments', dept.id), {
        name: dept.name,
        icon: dept.icon || null,
        createdAt: serverTimestamp(),
      });
      if (Array.isArray(dept.defaultUnits)) {
        await Promise.all(
          dept.defaultUnits.map((u) =>
            setDoc(doc(db, 'departments', dept.id, 'units', u.id), {
              name: u.name,
              createdAt: serverTimestamp(),
            })
          )
        );
      }
    })
  );
}

/** Obtener departamentos (si está vacío, siembra) */
export async function getDepartments() {
  await seedDepartmentsIfEmpty();
  const colRef = collection(db, 'departments');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Obtener unidades por departamento (si está vacío, usa defaults del catálogo) */
export async function getUnitsByDepartment(deptId) {
  if (!deptId) return [];
  const colRef = collection(db, 'departments', deptId, 'units');
  const snap = await getDocs(colRef);

  if (!snap.empty) {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Si la subcolección está vacía pero el dept es de los default, crea defaults
  const match = DEFAULT_DEPARTMENTS.find((d) => d.id === deptId);
  if (match && Array.isArray(match.defaultUnits)) {
    await Promise.all(
      match.defaultUnits.map((u) =>
        setDoc(doc(db, 'departments', deptId, 'units', u.id), {
          name: u.name,
          createdAt: serverTimestamp(),
        })
      )
    );
    // leer nuevamente
    const snap2 = await getDocs(colRef);
    return snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return [];
}
