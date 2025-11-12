// src/navigation/index.js
import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '../views/MapScreen';
import ReportsListScreen from '../views/ReportsListScreen';
import ReportScreen from '../views/ReportScreen';
import ReportDetailScreen from '../views/ReportDetailScreen';
import AuthLoginScreen from '../views/AuthLoginScreen';
import AuthRegisterScreen from '../views/AuthRegisterScreen';
import AdminPanelScreen from '../views/AdminPanelScreen';

import colors from '../theme/colors';
import { logout } from '../services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- Tabs de usuario normal ---------- */
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

/* ---------- Header con nombre ---------- */
function HeaderTitleWithUser({ user }) {
  const display = useMemo(() => {
    if (!user) return null;
    const byEmail = user.email?.split?.('@')?.[0] ?? '';
    return user.displayName || byEmail || null;
  }, [user]);

  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Mi Ciudad Verde</Text>
      {display ? (
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{display}</Text>
      ) : null}
    </View>
  );
}

/* ---------- Root Navigator ---------- */
function RootNavigator({ user }) {
  // Ya no hay spinner aquí; App.js muestra el ActivityIndicator mientras se inicializa
  const role = user?.role ? String(user.role).trim().toLowerCase() : 'user';

  return (
    <Stack.Navigator>
      {!user ? (
        // -------- NO LOGUEADO --------
        <>
          <Stack.Screen name="AuthLogin" component={AuthLoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthRegister" component={AuthRegisterScreen} options={{ headerShown: false }} />
        </>
      ) : role === 'admin' ? (
        // -------- ADMIN --------
        <>
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
            options={{
              headerTitle: () => <HeaderTitleWithUser user={user} />,
              headerRight: () => (
                <TouchableOpacity onPress={logout} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Cerrar sesión</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Detalle del reporte' }} />
        </>
      ) : (
        // -------- USER NORMAL --------
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{
              headerTitle: () => <HeaderTitleWithUser user={user} />,
              headerRight: () => (
                <TouchableOpacity onPress={logout} style={{ paddingHorizontal: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Cerrar sesión</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Detalle del reporte' }} />
          <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Nuevo reporte' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator({ user }) {
  // 👈 Exporta SOLO el árbol de navegadores (App.js ya tiene NavigationContainer)
  return <RootNavigator user={user} />;
}
