// src/viewmodels/useReportViewModel.js
import { useState } from 'react';
import { Alert } from 'react-native';
import { currentUser } from '../services/authService';
import { getCurrentCoords, reverseGeocode } from '../services/locationService';
import { saveReport } from '../services/firestoreService';
import { takePhoto, pickImage, pickVideo } from '../services/mediaService';
import NetInfo from '@react-native-community/netinfo';
import { queueReportOffline } from '../services/offlineQueueService';


export default function useReportViewModel({ navigation }) {
  const [incident, setIncident] = useState({
    description: '',
    category: '',
    subcategory: '',
    photos: [],
    videos: [],
    location: null,
    address: '',
  });

  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ☑️ seleccionar categoría
  const updateCategory = (categoryName) => {
    setIncident((prev) => ({
      ...prev,
      category: categoryName,
      subcategory: '',
      // si solo hay categoría, la descripción es la categoría
      description: categoryName,
    }));
  };

  // ☑️ seleccionar subcategoría
  const updateSubcategory = (subName) => {
    setIncident((prev) => ({
      ...prev,
      subcategory: subName,
      // categoría - subcategoría
      description: prev.category ? `${prev.category} - ${subName}` : subName,
    }));
  };

  // por si en algún momento quieres editar a mano
  const updateDescription = (text) => {
    setIncident((prev) => ({ ...prev, description: text }));
  };

  // ---- media ----
  const addPhotoFromGallery = async () => {
    try {
      const img = await pickImage();
      if (!img) return;
      setIncident((prev) => ({
        ...prev,
        photos: [...prev.photos, img],
      }));
    } catch (e) {
      console.log('[Gallery]', e);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const addPhotoFromCamera = async () => {
    try {
      const img = await takePhoto();
      if (!img) return;
      setIncident((prev) => ({
        ...prev,
        photos: [...prev.photos, img],
      }));
    } catch (e) {
      console.log('[Camera]', e);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const removePhoto = (uri) => {
    setIncident((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.uri !== uri),
    }));
  };

  const addVideo = async () => {
    try {
      const vid = await pickVideo();
      if (!vid) return;
      setIncident((prev) => ({
        ...prev,
        videos: [...prev.videos, vid],
      }));
    } catch (e) {
      console.log('[Video]', e);
      Alert.alert('Error', 'No se pudo seleccionar el video.');
    }
  };

  const removeVideo = (uri) => {
    setIncident((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.uri !== uri),
    }));
  };

  // ---- ubicación ----
  const useCurrentLocation = async () => {
    try {
      setBusy(true);
      const coords = await getCurrentCoords();
      const addr = await reverseGeocode(coords);
      setIncident((prev) => ({
        ...prev,
        location: coords,
        address: addr || prev.address || '',
      }));
    } catch (e) {
      Alert.alert('Ubicación', 'No pudimos obtener tu ubicación.');
    } finally {
      setBusy(false);
    }
  };

  // ---- enviar ----
  const submit = async () => {
  if (!incident.description) {
    Alert.alert('Falta info', 'Selecciona al menos una categoría.');
    return;
  }
  setSubmitting(true);

  try {
    const user = currentUser();

    const reportPayload = {
      description: incident.description,
      address: incident.address || '',
      location: incident.location || null,
      photoUrl: incident.photos[0]?.uri || '',
      photoUrls: incident.photos.map((p) => p.uri),
      videoUrls: incident.videos.map((v) => v.uri),
      category: incident.category || '',
      subcategory: incident.subcategory || '',
      userId: user?.uid || null,
      userEmail: user?.email || null,
      createdAt: Date.now(),
    };

    const net = await NetInfo.fetch();

    if (net.isConnected) {
      await saveReport(reportPayload);
      Alert.alert('Listo', 'Reporte enviado.');
    } else {
      await queueReportOffline(reportPayload);
      Alert.alert(
        'Sin conexión',
        'Tu reporte se guardó y se enviará automáticamente cuando recuperes conexión.'
      );
    }

    navigation.goBack?.();
  } catch (e) {
    console.log('[SUBMIT ERROR]', e);
    Alert.alert('Error', 'No se pudo guardar el reporte.');
  } finally {
    setSubmitting(false);
  }
};


  return {
    incident,
    busy,
    submitting,
    // expuesto al componente:
    updateCategory,
    updateSubcategory,
    updateDescription,
    addPhotoFromGallery,
    addPhotoFromCamera,
    removePhoto,
    addVideo,
    removeVideo,
    useCurrentLocation,
    submit,
  };
}
