// App.js
import React, { useEffect } from 'react';
import Navigation from './src/navigation';
import { initOfflineQueueListener } from './src/services/offlineQueueService';
import { subscribeToAuth } from './src/services/authService';

export default function App() {
  useEffect(() => {
    // Arranque de listeners propios de la app (sin notificaciones)
    const stopQueue = typeof initOfflineQueueListener === 'function'
      ? initOfflineQueueListener()
      : null;

    const unsubAuth = typeof subscribeToAuth === 'function'
      ? subscribeToAuth(() => {})
      : null;

    return () => {
      if (typeof stopQueue === 'function') stopQueue();
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  return <Navigation />;
}
