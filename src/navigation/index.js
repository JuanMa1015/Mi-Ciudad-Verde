// src/navigation/index.js
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '../views/MapScreen';
import ReportsListScreen from '../views/ReportsListScreen';
import ReportScreen from '../views/ReportScreen';
import ReportDetailScreen from '../views/ReportDetailScreen';
import AuthLoginScreen from '../views/AuthLoginScreen';
import AuthRegisterScreen from '../views/AuthRegisterScreen';

import colors from '../theme/colors';
import { subscribeToAuth, logout } from '../services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* --- Tabs: Mapa y Lista --- */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="TabMap"
        component={MapScreen}
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TabList"
        component={ReportsListScreen}
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

/* --- Root Navigator con Auth / Main / ReportDetail --- */
function RootNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen
            name="AuthLogin"
            component={AuthLoginScreen}
            options={{ title: 'Iniciar sesión', headerShown: false }}
          />
          <Stack.Screen
            name="AuthRegister"
            component={AuthRegisterScreen}
            options={{ title: 'Crear cuenta', headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{
              title: 'Mi Ciudad Verde',
              headerRight: () => (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await logout(); // 👈 Basta con esto: RootNavigator mostrará Auth* al quedar user=null
                    } catch (err) {
                      console.error('[LOGOUT ERROR]', err);
                    }
                  }}
                  style={{ paddingHorizontal: 8 }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Cerrar sesión</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
            options={{ title: 'Detalle del reporte' }}
          />
          <Stack.Screen
            name="Report"
            component={ReportScreen}
            options={{ title: 'Nuevo reporte' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

/* --- Export principal (NO NavigationContainer aquí) --- */
export default function AppNavigator() {
  return <RootNavigator />;
}
