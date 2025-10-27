import { useEffect, useState } from 'react';
import { firebaseApp } from '../services/firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

export default function useMapViewModel() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const col = collection(db, 'incidents');
    const q = query(col, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = [];
        snap.forEach((doc) => {
          const d = doc.data();
          rows.push({
            id: doc.id,
            description: d.description || '',
            address: d.address || '',

            userEmail: d.userEmail || '',
            userId: d.userId || '',
            userName: d.userName || '',

            location: d.location || { latitude: 0, longitude: 0 },
            photoUrl: d.photoUrl || '',
            // normaliza createdAt (Timestamp o number)
            createdAt:
              typeof d.createdAt === 'number'
                ? d.createdAt
                : d.createdAt?.toMillis?.() ?? Date.now(),
          });
        });
        setIncidents(rows);
        setLoading(false);
      },
      (err) => {
        console.error('[MapVM Firestore snapshot error]', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { loading, incidents };
}
