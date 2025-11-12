// src/views/admin/AdminHomeScreen.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de administración</Text>
      <Text>Pendiente: listar reportes, cambiar estado, asignar a entidad.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
});
