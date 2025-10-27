import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import useAuthViewModel from '../viewmodels/useAuthViewModel';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from '../services/firebase/app';

export default function AuthScreen({ navigation }) {
  const vm = useAuthViewModel({ navigation });
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // 🔹 Restablecer contraseña
  const handleResetPassword = async () => {
    if (!vm.email) {
      Alert.alert('Ingresa tu correo', 'Escribe tu correo para restablecer la contraseña.');
      return;
    }
    try {
      setResetting(true);
      const auth = getAuth(firebaseApp);
      await sendPasswordResetEmail(auth, vm.email.trim());
      Alert.alert(
        'Correo enviado',
        'Revisa tu bandeja de entrada o carpeta de spam para restablecer tu contraseña.'
      );
    } catch (e) {
      console.error('[RESET ERROR]', e);
      Alert.alert('Error', e.message || 'No fue posible enviar el correo.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="leaf" size={42} color={colors.primary} />
          <Text style={styles.title}>Mi Ciudad Verde</Text>
          <Text style={styles.subtitle}>Reportes ciudadanos ambientales</Text>
        </View>

        {/* Formulario */}
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
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={vm.password}
              onChangeText={vm.setPassword}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((s) => !s)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Botón Login */}
          <TouchableOpacity
            style={[styles.btnPrimary, vm.loading && { opacity: 0.7 }]}
            onPress={vm.signIn}
            disabled={vm.loading}
          >
            {vm.loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Botón Registro */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={vm.signUp}
            disabled={vm.loading}
          >
            <Text style={styles.btnSecondaryText}>Crear cuenta</Text>
          </TouchableOpacity>

          {/* 🔹 Olvidé mi contraseña */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={resetting}
            style={{ alignSelf: 'center', marginTop: 14 }}
          >
            {resetting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                ¿Olvidaste tu contraseña?
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Pie */}
        <Text style={styles.footer}>
          Al continuar, aceptas los términos y la política de privacidad.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  title: { marginTop: 8, fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { fontSize: 13, color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: {
    marginLeft: 8,
    height: 46,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnSecondary: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 10,
  },
  btnSecondaryText: { color: colors.primary, fontWeight: '800' },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: 16,
  },
});
