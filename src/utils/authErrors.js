// src/utils/authErrors.js
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos, o la cuenta no existe.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/email-already-in-use':
      return 'Ese correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil (usa al menos 6 caracteres).';
    case 'auth/network-request-failed':
      return 'Sin conexión o problema de red. Revisa tu internet.';
    default:
      return 'Ocurrió un error. Intenta nuevamente.';
  }
}
