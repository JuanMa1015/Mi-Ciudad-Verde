// src/services/firestoreService.js
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseApp } from './firebase/app';

const db = getFirestore(firebaseApp);

export async function addIncidentDoc(data) {
  const col = collection(db, 'incidents');
  const docRef = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteIncidentDoc(id) {
  const ref = doc(db, 'incidents', id);
  await deleteDoc(ref);
}
  