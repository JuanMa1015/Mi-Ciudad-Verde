// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      {/* Contenedor global de notificaciones */}
      <Toast />
    </>
  );
}
