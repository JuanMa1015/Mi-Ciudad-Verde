import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { login } from '../services/authService';
import { authErrorMessage } from '../utils/authErrors';

export default function useAuthLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      // No navegamos aquí; RootNavigator cambiará a Main al detectar usuario.
      Alert.alert('¡Bienvenido!', 'Sesión iniciada correctamente.');
    } catch (e) {
      console.error('[signIn]', e);
      Alert.alert('Error al iniciar sesión', authErrorMessage(e?.code));
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return { email, setEmail, password, setPassword, loading, signIn };
}
