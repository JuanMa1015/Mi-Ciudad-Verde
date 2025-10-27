import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { register } from '../services/authService';
import { authErrorMessage } from '../utils/authErrors';

export default function useAuthRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password.trim());
      Alert.alert('Cuenta creada', 'Te hemos registrado. Ahora puedes usar la app.');
      // RootNavigator detecta el usuario y te lleva a Main automáticamente.
    } catch (e) {
      console.error('[signUp]', e);
      Alert.alert('Error al registrarte', authErrorMessage(e?.code));
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return { email, setEmail, password, setPassword, loading, signUp };
}
