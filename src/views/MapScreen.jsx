// src/views/MapScreen.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import colors from '../theme/colors';
import useMapViewModel from '../viewmodels/useMapViewModel';
import { reverseGeocode } from '../services/locationService';

export default function MapScreen({ navigation }) {
  const { loading, incidents } = useMapViewModel();
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Estado para address on-the-fly si el reporte no lo trae
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');

  // Región inicial (usa el primer incidente como referencia o Medellín por defecto)
  const initialRegion = useMemo(
    () => ({
      latitude: incidents?.[0]?.location?.latitude ?? 6.25184,
      longitude: incidents?.[0]?.location?.longitude ?? -75.56359,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }),
    [incidents]
  );

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

  // Si el incidente no tiene address, resolvemos con reverse geocoding al abrir modal
  useEffect(() => {
    const fetchAddress = async () => {
      if (!selected) return;
      // Si ya trae address desde Firestore, úsala
      if (selected.address) {
        setResolvedAddress(selected.address);
        return;
      }
      const lat = selected.location?.latitude;
      const lng = selected.location?.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setResolvedAddress('');
        return;
      }
      try {
        setResolvingAddress(true);
        const addr = await reverseGeocode({ latitude: lat, longitude: lng });
        setResolvedAddress(addr || '');
      } catch {
        setResolvedAddress('');
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
      Alert.alert('Ubicación no disponible', 'Este reporte no tiene coordenadas válidas.');
      return;
    }
    const label = encodeURIComponent(
      selected.address || resolvedAddress || selected.description || 'Incidente'
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
        <Text style={{ color: colors.muted, marginTop: 8 }}>Cargando mapa…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {incidents.map((it) => {
          const lat = it.location?.latitude;
          const lng = it.location?.longitude;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          return (
            <Marker
              key={it.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={it.description || 'Incidente'}
              description={it.address || 'Toca para ver detalles'}
              onPress={() => onMarkerPress(it)}
            />
          );
        })}
      </MapView>

      {/* Modal de Detalle del marcador */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Imagen */}
            {selected?.photoUrl ? (
              <Image source={{ uri: selected.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={{ color: colors.muted }}>Sin imagen</Text>
              </View>
            )}

            {/* Descripción */}
            <Text style={styles.title}>{selected?.description || 'Sin descripción'}</Text>

            {/* Dirección (resuelve en vivo si no está) o Lat/Lng */}
            {resolvingAddress ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <ActivityIndicator size="small" />
                <Text style={[styles.meta, { marginLeft: 8 }]}>Obteniendo dirección…</Text>
              </View>
            ) : (
              <Text style={styles.meta}>
                {selected?.address ||
                  resolvedAddress ||
                  `Lat: ${selected?.location?.latitude?.toFixed?.(5) ?? '—'}   Lng: ${
                    selected?.location?.longitude?.toFixed?.(5) ?? '—'
                  }`}
              </Text>
            )}

            {/* Fecha y autor */}
            <Text style={styles.meta}>
              {(() => {
                const ms =
                  typeof selected?.createdAt === 'number'
                    ? selected.createdAt
                    : selected?.createdAt?.toMillis?.() ?? null;
                return ms ? new Date(ms).toLocaleString() : '';
              })()}
            </Text>
            {!!selected?.userEmail && (
              <Text style={styles.meta}>Autor: {selected.userEmail}</Text>
            )}

            {/* Acciones */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('ReportDetail', { incident: selected });
                }}
              >
                <Text style={styles.btnText}>Ver detalle</Text>
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

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

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
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13, marginBottom: 2 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary, marginLeft: 10 },

  close: { marginTop: 12, alignItems: 'center' },
  closeText: { color: colors.primary, fontWeight: '700' },
});
