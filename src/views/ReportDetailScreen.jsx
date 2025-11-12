// src/views/ReportDetailScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import colors from '../theme/colors';

// Firestore (fallback cuando solo llega el id)
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../services/firebase/app';

const db = getFirestore(app);

function formatDate(createdAt) {
  if (!createdAt) return '';
  const ms =
    typeof createdAt === 'number'
      ? createdAt
      : createdAt?.toMillis?.() ?? (createdAt?.seconds ? createdAt.seconds * 1000 : null);
  return ms ? new Date(ms).toLocaleString() : '';
}

function StatusPill({ value = 'nuevo' }) {
  const map = {
    nuevo:   { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
    en_proceso: { bg: '#E0F2FE', text: '#075985', border: '#BAE6FD' },
    resuelto:   { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
    rechazado:  { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  };
  const c = map[value] || map.nuevo;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.pillText, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function Chip({ children }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

export default function ReportDetailScreen({ route }) {
  // Acepta multiple naming para no romper flujos antiguos
  const param =
    route?.params?.incident ??
    route?.params?.item ??
    route?.params?.report ??
    null;
  const initialId = route?.params?.id ?? param?.id ?? null;

  const [docData, setDocData] = useState(param || null);
  const [loading, setLoading] = useState(!param && !!initialId);

  useEffect(() => {
    let mounted = true;
    async function fetchIfNeeded() {
      if (docData || !initialId) return;
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'incidents', initialId));
        if (!mounted) return;
        if (snap.exists()) setDocData({ id: snap.id, ...snap.data() });
        else setDocData(null);
      } catch (e) {
        console.error('ReportDetailScreen getDoc()', e);
        setDocData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchIfNeeded();
    return () => { mounted = false; };
  }, [initialId, docData]);

  const data = docData || {};
  const {
    description,
    address,
    photoUrl,
    photoUrls = [],
    location,
    category,
    subcategory,
    userEmail,
    userId,
    status = 'nuevo',
    assignedDept,
    assignedUnit,
    createdAt,
  } = data;

  const hasCoords =
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number';

  const allPhotos = useMemo(() => {
    const urls = [];
    if (typeof photoUrl === 'string' && photoUrl.trim()) urls.push(photoUrl.trim());
    if (Array.isArray(photoUrls)) {
      photoUrls.forEach((u) => {
        if (typeof u === 'string' && u.trim() && !urls.includes(u.trim())) urls.push(u.trim());
      });
    }
    return urls;
  }, [photoUrl, photoUrls]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.muted }}>Cargando reporte…</Text>
      </View>
    );
  }

  if (!docData && !param) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Reporte no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ===== Header ===== */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {category || 'Sin categoría'}
            {subcategory ? ` · ${subcategory}` : ''}
          </Text>
          <StatusPill value={status} />
        </View>
        <Text style={styles.dateText}>
          {formatDate(createdAt) || 'Fecha no especificada'}
        </Text>
        <View style={styles.headerChips}>
          {category ? <Chip>{category}</Chip> : null}
          {subcategory ? <Chip>{subcategory}</Chip> : null}
        </View>
      </View>

      {/* ===== Fotos ===== */}
      {allPhotos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Evidencia</Text>
          <View style={styles.divider} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {allPhotos.map((u) => (
              <Image key={u} source={{ uri: u }} style={styles.photo} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ===== Descripción ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{description || 'No especificada'}</Text>
      </View>

      {/* ===== Ubicación ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>
          {address || (hasCoords ? 'Ubicación establecida' : 'No especificada')}
        </Text>

        {hasCoords ? (
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              pointerEvents="none"
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker coordinate={location} title={address || 'Ubicación'} />
            </MapView>
          </View>
        ) : null}
      </View>

      {/* ===== Asignación / Estado ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gestión</Text>
        <View style={styles.divider} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Estado</Text>
            <Text style={styles.metaValue}>{status || 'nuevo'}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Departamento</Text>
            <Text style={styles.metaValue}>{assignedDept || '—'}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Unidad</Text>
            <Text style={styles.metaValue}>{assignedUnit || '—'}</Text>
          </View>
        </View>
      </View>

      {/* ===== Autor ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Autor</Text>
        <View style={styles.divider} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValue}>{userEmail || '—'}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>User ID</Text>
            <Text style={styles.metaValueMono}>{userId || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  container: { padding: 16, backgroundColor: colors.bg },

  /* Header */
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text, marginRight: 8 },
  dateText: { color: colors.muted, marginTop: 6 },
  headerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },

  /* Chips / Pills */
  chip: {
    backgroundColor: '#F3FFF4',
    borderWidth: 1,
    borderColor: '#BAF7C2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 12 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontWeight: '800', fontSize: 12 },

  /* Tarjetas de sección */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadow,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 8, marginBottom: 10 },

  body: { color: colors.text, lineHeight: 20 },

  /* Fotos */
  photo: {
    width: 240,
    height: 150,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },

  /* Mapa */
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  map: { flex: 1 },

  /* Meta en grilla */
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 12,
    marginTop: 4,
  },
  metaItem: {
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLabel: { color: '#6B7280', fontWeight: '700', marginBottom: 6, fontSize: 12, letterSpacing: 0.2 },
  metaValue: { color: colors.text, fontWeight: '800' },
  metaValueMono: { color: colors.text, fontWeight: '800', fontFamily: 'System', letterSpacing: 0.3 },
});
