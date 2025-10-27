// src/views/ReportScreen.jsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import colors from '../theme/colors';
import useReportViewModel from '../viewmodels/useReportViewModel';

export default function ReportScreen({ navigation }) {
  // Evita crash si el hook no carga
  const vm = useReportViewModel?.({ navigation }) || {};

  // Fallbacks seguros:
  const incident = vm.incident ?? {
    description: '',
    photoUrl: '',
    address: '',
    location: { latitude: 0, longitude: 0 },
  };

  const busy = !!vm.busy;
  const submitting = !!vm.submitting;

  const updateDescription = vm.updateDescription ?? (() => {});
  const attachFromGallery = vm.attachFromGallery ?? (() => {});
  const takeNewPhoto = vm.takeNewPhoto ?? (() => {});
  const useCurrentLocation = vm.useCurrentLocation ?? (() => {});
  const submit = vm.submit ?? (() => {});

  const loc = incident?.location || { latitude: 0, longitude: 0 };
  const hasCoords =
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    (loc.latitude !== 0 || loc.longitude !== 0);

  // ✅ Mostrar dirección si está disponible
  const coordsText = incident.address
    ? incident.address
    : hasCoords
    ? `Lat: ${loc.latitude.toFixed(5)}  Lng: ${loc.longitude.toFixed(5)}`
    : 'Ubicación no establecida';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo reporte</Text>
      <Text style={styles.subtitle}>Describe el problema ambiental</Text>

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Ej. Basura acumulada cerca de la cancha..."
        multiline
        value={incident.description}
        onChangeText={updateDescription}
      />

      {/* Foto */}
      <Text style={styles.label}>Foto</Text>
      {incident.photoUrl ? (
        <Image source={{ uri: incident.photoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={{ color: colors.muted }}>Sin foto</Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={attachFromGallery}
          disabled={busy}
        >
          <Text style={styles.btnSecondaryText}>Galería</Text>
        </TouchableOpacity>
        <View style={{ width: 12 }} />
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={takeNewPhoto}
          disabled={busy}
        >
          <Text style={styles.btnSecondaryText}>Cámara</Text>
        </TouchableOpacity>
      </View>

      {/* Ubicación */}
      <Text style={styles.label}>Ubicación</Text>
      <Text style={styles.coords}>{coordsText}</Text>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={useCurrentLocation}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.btnSecondaryText}>Usar ubicación actual</Text>
        )}
      </TouchableOpacity>

      {hasCoords ? (
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            pointerEvents="none"
            initialRegion={{
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: loc.latitude,
                longitude: loc.longitude,
              }}
              title={incident.address || 'Ubicación seleccionada'}
            />
          </MapView>
        </View>
      ) : null}

      {/* Enviar reporte */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={submit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Enviar reporte</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  label: { fontSize: 14, color: colors.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photo: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  coords: { color: colors.muted, marginBottom: 8 },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnSecondaryText: { color: colors.primary, fontWeight: '700' },
  mapWrapper: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  map: { flex: 1 },
});
