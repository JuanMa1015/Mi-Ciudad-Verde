// src/viewmodels/useMapViewModel.js
import { useEffect, useState } from 'react';
import { subscribeIncidents } from '../services/firestoreService';

// Hook que trae TODOS los reportes (públicos) para el mapa
export default function useMapViewModel() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeIncidents({
      scope: 'all',
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

            // compat viejo
            photoUrl: d.photoUrl || '',

            // arrays seguros
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
        console.log('[Map VM] snapshot error', err);
        setLoading(false);
      },
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return { loading, incidents };
}
