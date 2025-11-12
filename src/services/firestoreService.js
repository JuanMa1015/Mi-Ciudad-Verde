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

/* =========================
 * USERS (básico)
 * ========================= */
export async function createUserDoc({ uid, email, displayName = '', role = 'user' }) {
  if (!uid) return;
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      email: email || '',
      displayName: displayName || '',
      role: String(role || 'user').trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserRole(uid) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data().role || 'user').toString().trim().toLowerCase();
}

export async function getUserById(uid) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function subscribeUserDoc(uid, onNext, onError) {
  if (!uid) return () => {};
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, onNext, onError);
}

/* =========================
 * USERS – CRUD Admin
 * ========================= */
export function subscribeUsers({ onData, onError }) {
  try {
    const colRef = collection(db, 'users');
    const qRef = query(colRef, orderBy('email', 'asc'));
    return onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData?.(rows);
      },
      (e) => onError?.(e)
    );
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}

export async function upsertUserDoc({ uid, email, displayName = '', role = 'user' }) {
  if (!uid) throw new Error('uid requerido');
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      email: email || '',
      displayName: displayName || '',
      role: String(role || 'user').trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserDocFields(uid, fields) {
  if (!uid) throw new Error('uid requerido');
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserDoc(uid) {
  if (!uid) throw new Error('uid requerido');
  const ref = doc(db, 'users', uid);
  await deleteDoc(ref);
}

/* =========================
 * INCIDENTS
 * ========================= */
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

/** Asignar dept/unidad (no cambia estado) */
export async function assignIncidentTo(id, { deptId, deptName, unitId, unitName, adminEmail }) {
  const ref = doc(db, 'incidents', id);
  await updateDoc(ref, {
    assignedDept: deptName || deptId || null,
    assignedDeptId: deptId || null,
    assignedUnit: unitName || unitId || null,
    assignedUnitId: unitId || null,
    assignedAt: serverTimestamp(),
    assignedBy: adminEmail || null,
  });
}

/* =========================
 * DEPARTMENTS / UNITS (seed)
 * ========================= */
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

async function seedDepartmentsIfEmpty() {
  const colRef = collection(db, 'departments');
  const snap = await getDocs(colRef);
  if (!snap.empty) return;

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

export async function getDepartments() {
  await seedDepartmentsIfEmpty();
  const colRef = collection(db, 'departments');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUnitsByDepartment(deptId) {
  if (!deptId) return [];
  const colRef = collection(db, 'departments', deptId, 'units');
  const snap = await getDocs(colRef);
  if (!snap.empty) {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
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
    const snap2 = await getDocs(colRef);
    return snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return [];
}

/* =========================
 * CATEGORIES (seed + fetch idempotente + DEDUPE + CACHE)
 * ========================= */
const DEFAULT_CATEGORIES = [
  { id: 'Agua', name: 'Agua', subs: ['Aguas negras', 'Fuga', 'Inundación', 'Acueducto dañado'] },
  { id: 'Basura_y_residuos', name: 'Basura y residuos', subs: ['Acumulación', 'Punto crítico', 'Reciclaje'] },
  { id: 'Arboles_y_zonas_verdes', name: 'Árboles y zonas verdes', subs: ['Árbol caído', 'Poda', 'Zona verde abandonada'] },
  { id: 'Vias_Transito', name: 'Vías / Tránsito', subs: ['Huecos', 'Señalización', 'Semáforos'] },
  {
    id: 'Ruido_y_Contaminacion',
    name: 'Ruido y Contaminación',
    subs: ['Ruido urbano', 'Comercial', 'Obra', 'Vehicular', 'Eventos', 'Calidad del aire', 'Olores ofensivos'],
  },
];

function toDocId(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]/g, '')
    .toLowerCase();
}

async function seedCategoriesEnsureDefaults() {
  for (const cat of DEFAULT_CATEGORIES) {
    const catId = cat.id || toDocId(cat.name);
    await setDoc(
      doc(db, 'categories', catId),
      { name: cat.name, updatedAt: serverTimestamp(), order: 0 },
      { merge: true }
    );
    for (const sub of cat.subs || []) {
      const subId = toDocId(sub);
      await setDoc(
        doc(db, 'categories', catId, 'subcategories', subId),
        { name: sub, updatedAt: serverTimestamp(), order: 0 },
        { merge: true }
      );
    }
  }
}

/* Helpers de normalización/dedupe */
function normKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeAndDedupeCategories(raw) {
  const catMap = new Map(); // key: normName, val: { id, name, subs: Map }
  for (const c of raw) {
    const name = String(c?.name || 'Sin categoría').trim();
    const norm = normKey(name);
    const current = catMap.get(norm) || { id: c.id, name, subs: new Map() };

    for (const s of c.subs || []) {
      const sName = String(s?.name || '').trim();
      if (!sName) continue;
      const sNorm = normKey(sName);
      if (!current.subs.has(sNorm)) {
        current.subs.set(sNorm, { id: s.id || sNorm, name: sName });
      }
    }

    if (!catMap.has(norm)) current.id = c.id;
    catMap.set(norm, current);
  }

  const out = Array.from(catMap.values()).map((c) => {
    const subs = Array.from(c.subs.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { id: c.id, name: c.name, subs };
  });
  out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return out;
}

/* Cache en memoria */
let _catCache = null;          // { data, at:number }
let _catCachePromise = null;   // evita lecturas paralelas
const CAT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function invalidateCategoriesCache() {
  _catCache = null;
  _catCachePromise = null;
}

export async function getCategoriesWithSubs() {
  if (_catCache && Date.now() - _catCache.at < CAT_CACHE_TTL_MS) {
    return _catCache.data;
  }
  if (_catCachePromise) return _catCachePromise;

  _catCachePromise = (async () => {
    await seedCategoriesEnsureDefaults();

    const catSnap = await getDocs(collection(db, 'categories'));
    const raw = [];

    for (const c of catSnap.docs) {
      const subsSnap = await getDocs(collection(db, 'categories', c.id, 'subcategories'));
      raw.push({
        id: c.id,
        name: c.data()?.name ?? '',
        subs: subsSnap.docs.map((d) => ({ id: d.id, name: d.data()?.name ?? '' })),
      });
    }

    const cleaned = normalizeAndDedupeCategories(raw);

    _catCache = { data: cleaned, at: Date.now() };
    _catCachePromise = null;
    return cleaned;
  })();

  try {
    return await _catCachePromise;
  } catch (e) {
    _catCachePromise = null;
    throw e;
  }
}
