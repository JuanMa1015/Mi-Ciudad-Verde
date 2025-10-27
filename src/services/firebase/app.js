import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from './config'; // <— usa tu config.js (no el sample)

export const firebaseApp =
  getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
