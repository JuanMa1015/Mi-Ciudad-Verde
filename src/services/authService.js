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

// 🔐 inicializamos Auth con persistencia en AsyncStorage (Expo)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// cache simple del usuario actual
let currentUserCache = null;

// suscripción global
onAuthStateChanged(auth, (user) => {
  currentUserCache = user;
});

// 👉 para que tus otras pantallas puedan leer al usuario
export function currentUser() {
  return currentUserCache;
}

// 👉 suscribirse desde React (RootNavigator)
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// 👉 login
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  currentUserCache = cred.user;
  return cred.user;
}

// 👉 registro
export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // opcional: guardar nombre
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  currentUserCache = {
    ...cred.user,
    displayName: displayName || cred.user.displayName,
  };

  return currentUserCache;
}

// 👉 logout
export async function logout() {
  await signOut(auth);
  currentUserCache = null;
}
