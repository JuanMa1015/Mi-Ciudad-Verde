// src/services/authService.js
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from './firebase/app';
import { getUserRole, createUserDoc, subscribeUserDoc } from './firestoreService';

// Normaliza valores de rol
function normalizeRole(role) {
  if (!role) return 'user';
  return String(role).trim().toLowerCase();
}

// Auth con persistencia en RN/Expo
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Caché del usuario actual (incluye rol)
let currentUserCache = null;

// Refuerza la caché cuando cambia Auth (opcional)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log('[auth] signed out');
    currentUserCache = null;
    return;
  }
  const rawRole = await getUserRole(user.uid);
  const role = normalizeRole(rawRole);
  currentUserCache = { ...user, role };
});

// Obtener usuario actual (si lo necesitas en algún sitio)
export function currentUser() {
  return currentUserCache;
}

/**
 * Suscripción unificada: escucha Auth y, si hay user,
 * escucha también el doc /users/{uid} en tiempo real para el rol.
 */
export function subscribeToAuth(callback) {
  let unsubUserDoc = null;

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    // Limpia sub anterior si cambia usuario
    if (unsubUserDoc) {
      unsubUserDoc();
      unsubUserDoc = null;
    }

    if (!user) {
      console.log('[auth] signed out');
      currentUserCache = null;
      callback(null);
      return;
    }
    console.log('[auth] signed in:', user.email, 'uid:', user.uid);

    // Suscribimos el doc de usuario para actualizar el rol en vivo
    unsubUserDoc = subscribeUserDoc(
      user.uid,
      (snap) => {
        const data = snap?.exists() ? (snap.data() || {}) : {};
        const role = normalizeRole(data.role);
        const fullUser = { ...user, role };
        currentUserCache = fullUser;
        callback(fullUser);

        console.log('[auth] user doc ->', { uid: user.uid, email: user.email, role });
      },
      (err) => {
        console.error('subscribeUserDoc error:', err);
        const fallback = { ...user, role: 'user' };
        currentUserCache = fallback;
        callback(fallback);
      }
    );
  });

  return () => {
    unsubAuth && unsubAuth();
    unsubUserDoc && unsubUserDoc();
  };
}

/** Login */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const rawRole = await getUserRole(cred.user.uid);
  const role = normalizeRole(rawRole);
  currentUserCache = { ...cred.user, role };
  return currentUserCache;
}

/** Registro: crea usuario en Auth + doc /users */
export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  await createUserDoc({
    uid: cred.user.uid,
    email,
    displayName: displayName || cred.user.displayName || '',
    role: 'user',
  });

  currentUserCache = {
    ...cred.user,
    displayName: displayName || cred.user.displayName,
    role: 'user',
  };

  return currentUserCache;
}

/** Logout */
export async function logout() {
  await signOut(auth);
  currentUserCache = null;
}
