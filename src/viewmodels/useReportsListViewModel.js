// src/viewmodels/useReportsListViewModel.js
import { useEffect, useState } from 'react';
import { subscribeIncidents } from '../services/firestoreService';
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

    const init = async () => {
      setLoading(true);
      const user = currentUser();

      const baseOpts = {
        onData: (rows = []) => {
          const normalized = rows.map((d) => {
            const created =
              d.createdAt?.toMillis?.() ??
              (typeof d.createdAt === 'number' ? d.createdAt : Date.now());

            return {
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
              createdAt: created,
            };
          });

          setIncidents(normalized);
          setLoading(false);
        },
        onError: (err) => {
          console.log('[List VM] snapshot error', err);
          setLoading(false);
        },
      };

      if (scope === 'mine' && user?.uid) {
        // solo mis reportes
        unsubscribe = subscribeIncidents({
          ...baseOpts,
          scope: 'mine',
          userId: user.uid,
        });
      } else {
        // todos
        unsubscribe = subscribeIncidents({
          ...baseOpts,
          scope: 'all',
        });
      }
    };

    init();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [scope]);

  return { loading, incidents };
}
