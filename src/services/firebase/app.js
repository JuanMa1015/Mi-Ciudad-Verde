// src/services/firebase/app.js
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../firebase/config'; // <- tu config real

let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export { app };
