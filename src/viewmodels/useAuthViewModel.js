// src/viewmodels/useAuthViewModel.js
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { register, login, logout } from '../services/authService';

export default function useAuthViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const signIn = useCallback(async () => {
    if (!email || !password) return Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      // No navegamos: el RootNavigator cambia solo según user/role.
    } catch (e) {
      console.error('[signIn]', e);
      setErrorMsg(e.message || 'No fue posible iniciar sesión.');
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
      // Tampoco navegamos aquí.
    } catch (e) {
      console.error('[signUp]', e);
      setErrorMsg(e.message || 'No fue posible registrarte.');
      Alert.alert('Error', e.message || 'No fue posible registrarte.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleLogout = useCallback(async () => {
    await logout();
    // Nada de navigation.replace('Auth'); el Root te lleva.
  }, []);

  return {
    email, setEmail,
    password, setPassword,
    loading, errorMsg,
    signIn, signUp, handleLogout,
  };
}
