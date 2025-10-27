// src/services/notify.js
import Toast from 'react-native-toast-message';

export function showNewReportToast({ count = 1 } = {}) {
  const text1 =
    count === 1 ? 'Nuevo reporte disponible' : `${count} nuevos reportes`;
  Toast.show({
    type: 'success',
    text1,
    text2: 'Desliza para ver los detalles.',
    position: 'top',
    visibilityTime: 2500,
    topOffset: 50,
  });
}

export function showInfoToast(message) {
  Toast.show({
    type: 'info',
    text1: message,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 50,
  });
}
