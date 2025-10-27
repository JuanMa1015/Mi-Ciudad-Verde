import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import colors from '../theme/colors';
import { reverseGeocode } from '../services/locationService';

export default function ReportDetailScreen({ route }) {
  const { incident } = route.params;
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolving, setResolving] = useState(false);

  const lat = incident?.location?.latitude;
  const lng = incident?.location?.longitude;

  useEffect(() => {
    const fetchAddress = async () => {
      if (incident.address) {
        setResolvedAddress(incident.address);
        return;
      }
      if (typeof lat === 'number' && typeof lng === 'number') {
        try {
          setResolving(true);
          const addr = await reverseGeocode({ latitude: lat, longitude: lng });
          setResolvedAddress(addr || '');
        } finally {
          setResolving(false);
        }
      }
    };
    fetchAddress();
  }, [incident, lat, lng]);

  const formattedDate = (() => {
    const ms =
      typeof incident?.createdAt === 'number'
        ? incident.createdAt
        : incident?.createdAt?.toMillis?.() ?? null;
    return ms ? new Date(ms).toLocaleString() : 'Fecha desconocida';
  })();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Foto */}
      {incident.photoUrl ? (
        <Image source={{ uri: incident.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={{ color: colors.muted }}>Sin imagen</Text>
        </View>
      )}

      {/* Descripción */}
      <Text style={styles.title}>{incident.description || 'Sin descripción'}</Text>

      {/* Dirección */}
      {resolving ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <ActivityIndicator size="small" />
          <Text style={[styles.meta, { marginLeft: 8 }]}>Obteniendo dirección…</Text>
        </View>
      ) : (
        <Text style={styles.meta}>
          {resolvedAddress ||
            `Lat: ${lat?.toFixed?.(5) ?? '—'}  Lng: ${lng?.toFixed?.(5) ?? '—'}`}
        </Text>
      )}

      {/* Fecha */}
      <Text style={styles.meta}>📅 {formattedDate}</Text>

      {/* Autor */}
      {incident.userEmail && (
        <Text style={styles.meta}>👤 Reportado por: {incident.userEmail}</Text>
      )}

      {/* Mapa */}
      {typeof lat === 'number' && typeof lng === 'number' && (
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            pointerEvents="none"
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} />
          </MapView>
        </View>
      )}
    </ScrollView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.bg,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 4,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  map: { flex: 1 },
});
