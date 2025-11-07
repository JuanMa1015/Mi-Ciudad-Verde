// src/viewmodels/useMapViewModel.js
import { useEffect, useState } from 'react';
import { subscribeIncidents } from '../services/firestoreService';

// Hook que trae TODOS los reportes (públicos) para el mapa
export default function useMapViewModel() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // nos suscribimos a TODOS
    const unsubscribe = subscribeIncidents({
      scope: 'all',
      onData: (rows) => {
        // Normalizamos un poquito por si algún doc viene viejo
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
        console.log('[Map VM] snapshot error', err);
        setLoading(false);
      },
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return { loading, incidents };
}
