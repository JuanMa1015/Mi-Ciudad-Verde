import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { currentUser } from '../services/authService';
import { subscribeIncidents } from '../services/realtimeIncidents';
import { deleteIncidentDoc } from '../services/firestoreService';
import { showNewReportToast } from '../services/notify';

export default function useReportsListViewModel() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const user = currentUser();
  const prevIdsRef = useRef(new Set());
  const raf = useRef(null);

  useEffect(() => {
    if (!user) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeIncidents({
      scope: 'mine',
      userId: user.uid,
      onData: (rows) => {
        const prev = prevIdsRef.current;
        const incomingIds = new Set(rows.map((r) => r.id));
        let newCount = 0;
        rows.forEach((r) => {
          if (!prev.has(r.id)) newCount += 1;
        });
        prevIdsRef.current = incomingIds;
        if (newCount > 0) showNewReportToast({ count: newCount });

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

  const deleteIncident = useCallback(async (id) => {
    Alert.alert(
      'Eliminar reporte',
      '¿Seguro que quieres eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIncidentDoc(id);
            } catch (err) {
              Alert.alert('Error', 'No fue posible eliminar el reporte.');
            }
          },
        },
      ]
    );
  }, []);

  return { loading, incidents, deleteIncident };
}
