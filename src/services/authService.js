// src/services/authService.js
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseApp } from './firebase/app';

/**
 * Inicializa Firebase Auth con persistencia en React Native.
 * Esto permite mantener la sesión activa entre reinicios de la app.
 */
const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

/**
 * Registra un nuevo usuario con correo y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function register(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return user;
}

/**
 * Inicia sesión con correo y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/**
 * Cierra sesión y limpia la persistencia local.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Escucha los cambios del estado de autenticación.
 * Se usa en el RootNavigator para detectar si hay usuario activo.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} función para cancelar la suscripción
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Devuelve el usuario actual si existe.
 * @returns {import('firebase/auth').User | null}
 */
export function currentUser() {
  return auth.currentUser;
}
