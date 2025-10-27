import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import useAuthRegisterViewModel from '../viewmodels/useAuthRegisterViewModel';

export default function AuthRegisterScreen({ navigation }) {
  const vm = useAuthRegisterViewModel();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="person-add" size={36} color={colors.primary} />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate con tu correo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            placeholder="tu@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={vm.email}
            onChangeText={vm.setEmail}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
          <TextInput
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={vm.password}
            onChangeText={vm.setPassword}
            style={styles.input}
          />

          <TouchableOpacity style={[styles.btnPrimary, vm.loading && { opacity: 0.7 }]} onPress={vm.signUp} disabled={vm.loading}>
            {vm.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Registrarme</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: colors.muted }}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.replace('AuthLogin')}>
            <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  title: { marginTop: 8, fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 13, color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8,
  },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
});
