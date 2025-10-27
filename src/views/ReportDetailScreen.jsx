import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Share, Linking, ScrollView } from 'react-native';
import colors from '../theme/colors';

function openInMaps(lat, lng, label = 'Incidente') {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url);
}

async function shareIncident({ description, location }) {
  const text = `${description}\nUbicación: ${location.latitude}, ${location.longitude}\nMapa: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  await Share.share({ message: text });
}

export default function ReportDetailScreen({ route }) {
  const incident = route.params?.incident || {};
  const hasPhoto = Boolean(incident.photoUrl);

  const dateText = useMemo(() => {
    if (!incident.createdAt) return '';
    try {
      return new Date(incident.createdAt).toLocaleString();
    } catch {
      return '';
    }
  }, [incident.createdAt]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Detalle del reporte</Text>
      {hasPhoto && <Image source={{ uri: incident.photoUrl }} style={styles.photo} />}
      <Text style={styles.desc}>{incident.description || 'Sin descripción'}</Text>
      {incident.location && (
        <Text style={styles.coords}>
          {`Lat: ${incident.location.latitude?.toFixed?.(5)}  Lng: ${incident.location.longitude?.toFixed?.(5)}`}
        </Text>
      )}
      {dateText ? <Text style={styles.muted}>{dateText}</Text> : null}

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => openInMaps(incident.location.latitude, incident.location.longitude, 'Incidente')}
      >
        <Text style={styles.btnText}>Abrir en Google Maps</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={() => shareIncident(incident)}>
        <Text style={styles.btnSecondaryText}>Compartir</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  photo: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10, backgroundColor: '#F3F4F6' },
  desc: { color: colors.text, marginBottom: 6, fontWeight: '600' },
  coords: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  muted: { color: colors.muted, fontSize: 12 },
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primary, marginTop: 10 },
  btnSecondaryText: { color: colors.primary, fontWeight: '700' },
});
