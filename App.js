import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation';
import Toast from 'react-native-toast-message';
import { View, ActivityIndicator } from 'react-native';
import colors from './src/theme/colors';

// Servicios
import { initOfflineQueueListener } from './src/services/offlineQueueService';
import { subscribeToAuth } from './src/services/authService';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState(null);

  // Iniciar el listener de reportes offline (se activa cuando hay conexión)
  useEffect(() => {
    initOfflineQueueListener();
  }, []);

  // Escuchar estado de autenticación para mantener sesión activa
  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
        console.log('[App] subscribeToAuth ->', u?.email, 'role:', u?.role);
      setUser(u);
      setInitialized(true);
    });
    return () => unsub();
  }, []);

  // Mostrar pantalla de carga mientras se inicializa la sesión
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render principal
  return (
    <>
      <NavigationContainer>
        <AppNavigator user={user} />
      </NavigationContainer>

      {/* Contenedor global de notificaciones */}
      <Toast />
    </>
  );
}
