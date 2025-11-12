import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { saveReport } from './firestoreService';

/**
 * Agrega un reporte a la cola offline
 */
export async function queueReportOffline(report) {
  try {
    const existing = await AsyncStorage.getItem('pendingReports');
    const list = existing ? JSON.parse(existing) : [];
    list.push(report);
    await AsyncStorage.setItem('pendingReports', JSON.stringify(list));
    console.log('✅ Reporte guardado offline');
  } catch (err) {
    console.log('[OfflineQueue] Error guardando:', err);
  }
}

/**
 * Sube todos los reportes pendientes cuando haya conexión
 */
export async function processOfflineQueue() {
  try {
    const existing = await AsyncStorage.getItem('pendingReports');
    const list = existing ? JSON.parse(existing) : [];

    if (list.length === 0) return;

    console.log(`📤 Intentando subir ${list.length} reportes pendientes...`);
    const uploaded = [];

    for (const r of list) {
      try {
        await saveReport(r);
        uploaded.push(r);
      } catch (err) {
        console.log('[OfflineQueue] Error subiendo reporte:', err);
      }
    }

    // borrar los que sí se subieron
    if (uploaded.length > 0) {
      const remaining = list.filter(
        (r) => !uploaded.some((u) => u.createdAt === r.createdAt)
      );
      await AsyncStorage.setItem('pendingReports', JSON.stringify(remaining));
      console.log(`✅ Subidos ${uploaded.length} reportes pendientes`);
    }
  } catch (err) {
    console.log('[OfflineQueue] Error procesando cola:', err);
  }
}

/**
 * Inicia un listener que se activa al volver a estar online
 */
export function initOfflineQueueListener() {
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processOfflineQueue();
    }
  });
}
