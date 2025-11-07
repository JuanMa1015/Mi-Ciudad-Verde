// src/views/ReportDetailScreen.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');

export default function ReportDetailScreen({ route, navigation }) {
  const incident = route?.params?.incident || {};

  // normalizar categoría / subcategoría
  let category = incident.category || '';
  let subcategory = incident.subcategory || '';

  if ((!category || !subcategory) && typeof incident.description === 'string') {
    const parts = incident.description.split(' - ');
    if (!category && parts[0]) category = parts[0];
    if (!subcategory && parts[1]) subcategory = parts[1];
  }
  if (!category) category = 'No especificada';
  if (!subcategory) subcategory = '—';

  // normalizar fotos
  let photoUrls = [];
  if (Array.isArray(incident.photoUrls)) {
    photoUrls = incident.photoUrls;
  } else if (typeof incident.photoUrls === 'string') {
    try {
      const arr = JSON.parse(incident.photoUrls);
      if (Array.isArray(arr)) photoUrls = arr;
    } catch {}
  }
  if (incident.photoUrl && !photoUrls.length) {
    photoUrls = [incident.photoUrl];
  }

  // normalizar videos
  let videoUrls = [];
  if (Array.isArray(incident.videoUrls)) {
    videoUrls = incident.videoUrls;
  } else if (typeof incident.videoUrls === 'string') {
    try {
      const arr = JSON.parse(incident.videoUrls);
      if (Array.isArray(arr)) videoUrls = arr;
    } catch {}
  }

  const description = incident.description || 'Sin descripción';
  const address = incident.address || 'Dirección aproximada no disponible';
  const author = incident.userEmail || 'Usuario no identificado';

  // fecha
  let createdAtText = 'Fecha no disponible';
  if (incident.createdAt) {
    if (incident.createdAt.seconds) {
      createdAtText = new Date(incident.createdAt.seconds * 1000).toLocaleString();
    } else {
      const d = new Date(incident.createdAt);
      if (!isNaN(d.getTime())) {
        createdAtText = d.toLocaleString();
      }
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del reporte</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Card principal */}
      <View style={styles.card}>
        <Text style={styles.title}>{description}</Text>

        <View style={styles.row}>
          <Ionicons name="location" size={16} color="#EF4444" style={styles.rowIcon} />
          <Text style={styles.rowText}>{address}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="pricetag" size={16} color="#F59E0B" style={styles.rowIcon} />
          <Text style={styles.rowText}>Categoría: {category}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="flag" size={16} color="#DC2626" style={styles.rowIcon} />
          <Text style={styles.rowText}>Subcategoría: {subcategory}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="person" size={16} color="#3B82F6" style={styles.rowIcon} />
          <Text style={styles.rowText}>Reportado por: {author}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="time" size={16} color="#10B981" style={styles.rowIcon} />
          <Text style={styles.rowText}>{createdAtText}</Text>
        </View>

        {(photoUrls.length > 0 || videoUrls.length > 0) && (
          <View style={[styles.badge, { marginTop: 10 }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.badgeText}>
              Este reporte tiene
              {photoUrls.length > 0
                ? ` ${photoUrls.length} foto${photoUrls.length > 1 ? 's' : ''}`
                : ''}
              {photoUrls.length > 0 && videoUrls.length > 0 ? ' y' : ''}
              {videoUrls.length > 0
                ? ` ${videoUrls.length} video${videoUrls.length > 1 ? 's' : ''}`
                : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Fotos */}
      {photoUrls.length > 0 && (
        <View style={styles.mediaBlock}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photoUrls.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Videos */}
      {videoUrls.length > 0 && (
        <View style={styles.mediaBlock}>
          <Text style={styles.sectionTitle}>Videos</Text>
          {videoUrls.map((uri, idx) => (
            <View key={idx} style={{ marginBottom: 12 }}>
              <Video
                source={{ uri }}
                style={styles.video}
                useNativeControls
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F4EB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  rowIcon: { marginRight: 6, marginTop: 2 },
  rowText: { flex: 1, color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  badgeText: { color: '#166534', fontWeight: '500' },
  mediaBlock: { marginHorizontal: 16, marginTop: 4 },
  sectionTitle: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  photo: {
    width: width * 0.6,
    height: 160,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#000',
  },
  backBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 999,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  backText: { color: '#fff', fontWeight: '700' },
});
