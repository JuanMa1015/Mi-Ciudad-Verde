import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { register, login, subscribeToAuth, logout } from '../services/authService';
import { log } from '../services/logger';

export default function useAuthViewModel({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Escucha cambios de autenticación
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      if (user) {
        log('Auth: usuario activo →', user.email);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    });
    return unsub;
  }, [navigation]);

  const signIn = useCallback(async () => {
    if (!email || !password) return Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (e) {
      console.error('[signIn]', e);
      Alert.alert('Error', e.message || 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const signUp = useCallback(async () => {
    if (!email || !password) return Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
    setLoading(true);
    try {
      await register(email.trim(), password.trim());
      Alert.alert('Cuenta creada', 'Tu cuenta fue registrada correctamente.');
    } catch (e) {
      console.error('[signUp]', e);
      Alert.alert('Error', e.message || 'No fue posible registrarte.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigation.replace('Auth');
  }, [navigation]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    signIn,
    signUp,
    handleLogout,
  };
}
