// src/views/MapScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import colors from '../theme/colors';
import { reverseGeocode } from '../services/locationService';
import useMapViewModel from '../viewmodels/useMapViewModel';

export default function MapScreen({ navigation }) {
  const { loading, incidents } = useMapViewModel();
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const onMarkerPress = useCallback((incident) => {
    setSelected(incident);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelected(null);
    setResolvedAddress('');
    setResolvingAddress(false);
  }, []);

  // cuando se abre el modal intentamos mostrar dirección humana
  useEffect(() => {
    const fetchAddress = async () => {
      if (!selected) return;

      // si el reporte YA trae address, usamos esa
      if (selected.address && selected.address.trim() !== '') {
        setResolvedAddress(selected.address);
        return;
      }

      const lat = selected.location?.latitude;
      const lng = selected.location?.longitude;

      // si no hay coords, no mostramos números al usuario
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setResolvedAddress('Dirección aproximada no disponible');
        return;
      }

      try {
        setResolvingAddress(true);
        const addr = await reverseGeocode({ latitude: lat, longitude: lng });
        setResolvedAddress(addr || 'Dirección aproximada no disponible');
      } catch (e) {
        setResolvedAddress('Dirección aproximada no disponible');
      } finally {
        setResolvingAddress(false);
      }
    };

    if (modalVisible) fetchAddress();
  }, [modalVisible, selected]);

  const openInMaps = useCallback(() => {
    if (!selected) return;
    const lat = selected.location?.latitude;
    const lng = selected.location?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      Alert.alert('Ubicación', 'Este reporte no tiene coordenadas válidas.');
      return;
    }

    const label = encodeURIComponent(
      selected.address ||
        resolvedAddress ||
        selected.description ||
        'Incidente'
    );

    const url =
      Platform.select({
        ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No fue posible abrir la app de mapas.')
    );
  }, [selected, resolvedAddress]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Cargando mapa…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 6.25184,
          longitude: -75.56359,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {incidents.map((incident) => {
          const lat = incident.location?.latitude;
          const lng = incident.location?.longitude;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          return (
            <Marker
              key={incident.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={incident.description || 'Incidente'}
              description={
                incident.category
                  ? `Categoría: ${incident.category}`
                  : 'Toca para ver detalles'
              }
              onPress={() => onMarkerPress(incident)}
            />
          );
        })}
      </MapView>

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>
              {selected?.description || 'Sin descripción'}
            </Text>

            <Text style={styles.meta}>
              {resolvingAddress
                ? 'Obteniendo dirección…'
                : resolvedAddress || 'Dirección aproximada no disponible'}
            </Text>

            <Text style={styles.meta}>
              Categoría:{' '}
              {selected?.category && selected.category.trim() !== ''
                ? selected.category
                : 'No especificada'}
            </Text>

            <Text style={styles.meta}>
              Subcategoría:{' '}
              {selected?.subcategory && selected.subcategory.trim() !== ''
                ? selected.subcategory
                : '—'}
            </Text>

            {(selected?.photoUrls?.length > 0 ||
              selected?.videoUrls?.length > 0) && (
              <Text style={styles.meta}>
                {selected?.photoUrls?.length
                  ? `📸 ${selected.photoUrls.length} foto${
                      selected.photoUrls.length > 1 ? 's' : ''
                    }`
                  : ''}
                {selected?.photoUrls?.length && selected?.videoUrls?.length
                  ? ' • '
                  : ''}
                {selected?.videoUrls?.length
                  ? `🎥 ${selected.videoUrls.length} video${
                      selected.videoUrls.length > 1 ? 's' : ''
                    }`
                  : ''}
              </Text>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  closeModal();
                  navigation.navigate('ReportDetail', { incident: selected });
                }}
              >
                <Text style={styles.btnText}>Ver detalles</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnOutline]}
                onPress={openInMaps}
              >
                <Text style={[styles.btnText, { color: colors.primary }]}>
                  Abrir en mapas
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.close} onPress={closeModal}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13, marginBottom: 2 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    marginLeft: 10,
  },
  close: { marginTop: 12, alignItems: 'center' },
  closeText: { color: colors.primary, fontWeight: '700' },
});
