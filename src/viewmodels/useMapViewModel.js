// src/viewmodels/useMapViewModel.js
import { useEffect, useState, useRef } from 'react';
import { subscribeIncidents } from '../services/realtimeIncidents';
import { showNewReportToast } from '../services/notify';

export default function useMapViewModel() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);

  // Para detectar nuevos docs
  const prevIdsRef = useRef(new Set());
  const raf = useRef(null);

  useEffect(() => {
    const unsub = subscribeIncidents({
      scope: 'all',
      onData: (rows) => {
        // Detectar nuevos (por id) que antes no existían
        const prev = prevIdsRef.current;
        const incomingIds = new Set(rows.map((r) => r.id));
        let newCount = 0;
        rows.forEach((r) => {
          if (!prev.has(r.id)) newCount += 1;
        });
        // Actualizar ref
        prevIdsRef.current = incomingIds;

        if (newCount > 0) {
          showNewReportToast({ count: newCount });
        }

        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          setIncidents(rows);
          setLoading(false);
        });
      },
      onError: () => setLoading(false),
    });

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      unsub();
    };
  }, []);

  return { loading, incidents };
}
