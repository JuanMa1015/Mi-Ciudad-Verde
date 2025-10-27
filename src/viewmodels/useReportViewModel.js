// src/viewmodels/useReportViewModel.js
import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { createIncident } from '../models/Incident';
import { currentUser } from '../services/authService';
import * as LocationService from '../services/locationService';
import * as MediaService from '../services/mediaService';
import * as FirestoreService from '../services/firestoreService';
import { log } from '../services/logger';

function showBlockedPermissionAlert(title, body) {
  Alert.alert(
    title,
    `${body}\n\nPuedes habilitarlo en Ajustes del sistema.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir Ajustes', onPress: () => Linking.openSettings?.() },
    ]
  );
}

export default function useReportViewModel({ navigation }) {
  const user = currentUser();
  const [incident, setIncident] = useState(createIncident({ userId: user?.uid || 'guest' }));
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);

  const updateDescription = useCallback((text) => {
    setIncident((prev) => ({ ...prev, description: text }));
  }, []);

  const attachFromGallery = useCallback(async () => {
    try {
      setBusy(true);
      const img = await MediaService.pickImage();
      if (img) setIncident((p) => ({ ...p, photoUrl: img.uri }));
    } catch (e) {
      console.error('[Gallery]', e);
      Alert.alert('Error', e.message ?? 'No fue posible abrir la galería.');
    } finally {
      setBusy(false);
    }
  }, []);

  const takeNewPhoto = useCallback(async () => {
    try {
      setBusy(true);
      const img = await MediaService.takePhoto();
      if (img) setIncident((p) => ({ ...p, photoUrl: img.uri }));
    } catch (e) {
      console.error('[Camera]', e);
      Alert.alert('Error', e.message ?? 'No fue posible tomar la foto.');
    } finally {
      setBusy(false);
    }
  }, []);

  /** ✅ Usa ubicación actual y guarda dirección */
  const useCurrentLocation = useCallback(async () => {
    try {
      setBusy(true);
      const coords = await LocationService.getCurrentCoords();
      const address = await LocationService.reverseGeocode(coords);

      setIncident((p) => ({
        ...p,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        address: address || 'Ubicación desconocida',
      }));
    } catch (e) {
      console.error('[Location]', e);
      if (e?.code === 'LOCATION_PERMISSION_DENIED') {
        showBlockedPermissionAlert(
          'Permiso de ubicación requerido',
          'Sin permiso no podemos obtener tu ubicación.'
        );
      } else {
        Alert.alert(
          'Error',
          `Ubicación: ${e?.message ?? 'No fue posible obtener tu ubicación.'}`
        );
      }
    } finally {
      setBusy(false);
    }
  }, []);


  const submit = useCallback(async () => {
    if (!incident.description?.trim()) {
      Alert.alert('Falta descripción', 'Describe el problema.');
      return;
    }

    const hasCoords =
      typeof incident.location?.latitude === 'number' &&
      typeof incident.location?.longitude === 'number';

    if (!hasCoords) {
      Alert.alert('Falta ubicación', 'Agrega tu ubicación.');
      return;
    }

    setSubmitting(true);
    try {
      const userId = user?.uid || 'guest';
      const generatedId = nanoid(12);

      const newIncident = {
        ...incident,
        id: generatedId,
        userId,
        userEmail: user?.email ?? 'anon',
        createdAt: new Date(),
      };

      await FirestoreService.addIncidentDoc(newIncident);
      Alert.alert('¡Gracias!', 'Tu reporte fue enviado correctamente.');
      setIncident(createIncident({ userId }));
      navigation.navigate('Main');
    } catch (e) {
      console.error('[SUBMIT ERROR]', e);
      Alert.alert('Error', 'No fue posible enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  }, [incident, navigation]);

  return {
    incident,
    submitting,
    busy,
    updateDescription,
    attachFromGallery,
    takeNewPhoto,
    useCurrentLocation,
    submit,
  };
}
