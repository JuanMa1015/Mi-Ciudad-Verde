import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthScreen from '../views/AuthScreen';
import ReportScreen from '../views/ReportScreen';
import MapScreen from '../views/MapScreen';
import ReportsListScreen from '../views/ReportsListScreen';

export * as LocationService from './locationService';
export * as FirestoreService from './firestoreService';
export * from './authService';
export * from './logger';
export { MediaService } from './mediaService';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E8F4A',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="TabMap"
        component={MapScreen}
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TabList"
        component={ReportsListScreen}
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: 'Mi Ciudad Verde — Acceso', headerBackVisible: false }}
      />

      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={({ navigation }) => ({
          title: 'Incidentes',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Report')}
              style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1E8F4A' }}
            >
              <Text style={{ color: '#1E8F4A', fontWeight: '700' }}>Reportar</Text>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.replace('Auth')} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
              <Text style={{ color: '#6B7280' }}>Salir</Text>
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'Reportar Incidente' }}
      />
      
    </Stack.Navigator>
  );
}
