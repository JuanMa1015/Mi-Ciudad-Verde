// src/viewmodels/useReportsListViewModel.js
import { useEffect, useState } from 'react';
import { subscribeIncidents, getUserReports } from '../services/firestoreService';
import { currentUser } from '../services/authService';

/**
 * Hook para listar reportes (todos o solo los del usuario actual)
 * @param {'all'|'mine'} scope
 */
export default function useReportsListViewModel(scope = 'all') {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    let unsubscribe;

    async function init() {
      setLoading(true);
      const user = currentUser();

      // Si el usuario quiere ver solo los suyos
      if (scope === 'mine' && user?.uid) {
        // suscripción realtime
        unsubscribe = subscribeIncidents({
          scope: 'mine',
          userId: user.uid,
          onData: (rows) => {
            const normalized = rows.map((d) => ({
              id: d.id,
              description: d.description || '',
              address: d.address || '',
              location: d.location || { latitude: 0, longitude: 0 },
              photoUrl: d.photoUrl || '',
              photoUrls: Array.isArray(d.photoUrls)
                ? d.photoUrls
                : d.photoUrls
                ? [d.photoUrls]
                : [],
              videoUrls: Array.isArray(d.videoUrls)
                ? d.videoUrls
                : d.videoUrls
                ? [d.videoUrls]
                : [],
              category: d.category || '',
              subcategory: d.subcategory || '',
              userEmail: d.userEmail || '',
              userId: d.userId || '',
              createdAt: d.createdAt ?? Date.now(),
            }));
            setIncidents(normalized);
            setLoading(false);
          },
          onError: (err) => {
            console.log('[List VM] snapshot error', err);
            setLoading(false);
          },
        });
      } else {
        // Todos los reportes
        unsubscribe = subscribeIncidents({
          scope: 'all',
          onData: (rows) => {
            const normalized = rows.map((d) => ({
              id: d.id,
              description: d.description || '',
              address: d.address || '',
              location: d.location || { latitude: 0, longitude: 0 },
              photoUrl: d.photoUrl || '',
              photoUrls: Array.isArray(d.photoUrls)
                ? d.photoUrls
                : d.photoUrls
                ? [d.photoUrls]
                : [],
              videoUrls: Array.isArray(d.videoUrls)
                ? d.videoUrls
                : d.videoUrls
                ? [d.videoUrls]
                : [],
              category: d.category || '',
              subcategory: d.subcategory || '',
              userEmail: d.userEmail || '',
              userId: d.userId || '',
              createdAt: d.createdAt ?? Date.now(),
            }));
            setIncidents(normalized);
            setLoading(false);
          },
          onError: (err) => {
            console.log('[List VM] snapshot error', err);
            setLoading(false);
          },
        });
      }
    }

    init();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [scope]);

  return { loading, incidents };
}
