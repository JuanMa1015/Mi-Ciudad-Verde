// src/views/ReportScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import useReportViewModel from '../viewmodels/useReportViewModel';
import { getCategoriesWithSubs } from '../services/firestoreService';

export default function ReportScreen({ navigation }) {
  const vm = useReportViewModel({ navigation });

  const {
    incident,
    busy,
    submitting,
    updateCategory,
    updateSubcategory,
    addPhotoFromGallery,
    addPhotoFromCamera,
    removePhoto,
    addVideo,
    removeVideo,
    useCurrentLocation,
    submit,
  } = vm;

  // === Catálogo desde Firestore ===
  const [categories, setCategories] = useState([]); // [{id,name,subs:[{id,name}]}]
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCategoriesWithSubs();
        setCategories(data);
      } catch (e) {
        console.error('getCategoriesWithSubs()', e);
        Alert.alert('Error', 'No fue posible cargar categorías.');
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  // Subcategorías según lo que esté seleccionado por nombre
  const subOptions = useMemo(() => {
    const cat = categories.find((c) => c.name === incident.category);
    return cat?.subs || [];
  }, [categories, incident.category]);

  // UI
  const loc = incident.location;
  const hasCoords =
    loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number';

  const coordsText = incident.address
    ? incident.address
    : hasCoords
    ? 'Ubicación establecida'
    : 'Ubicación no establecida';

  // Icono por categoría (fallback si en Firestore no hay iconos)
  function getIconForCategory(catName) {
    const n = (catName || '').toLowerCase();
    if (n.includes('basura')) return 'trash-outline';
    if (n.includes('verde') || n.includes('árbol') || n.includes('arbol')) return 'leaf-outline';
    if (n.includes('agua')) return 'water-outline';
    if (n.includes('ruido')) return 'volume-high-outline';
    if (n.includes('tránsito') || n.includes('transito') || n.includes('vías') || n.includes('vias')) return 'navigate-outline';
    return 'alert-circle-outline';
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo reporte</Text>
      <Text style={styles.subtitle}>
        Selecciona el tipo de problema y agrega evidencia
      </Text>

      {/* CATEGORÍAS (de Firestore) */}
      <Text style={styles.label}>Categoría</Text>
      {catLoading ? (
        <View style={[styles.categoriesRow, { paddingVertical: 6 }]}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.categoriesRow}>
          {categories.map((cat) => {
            const isSelected = incident.category === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
                onPress={() => {
                  // si cambia de categoría y sub no pertenece, el VM ya debería limpiar; por si acaso:
                  if (incident.category !== cat.name) updateSubcategory('');
                  updateCategory(cat.name); // trabajamos por nombre igual que en Admin
                }}
              >
                <Ionicons
                  name={getIconForCategory(cat.name)}
                  size={22}
                  color={isSelected ? '#fff' : colors.primary}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && { color: '#fff' },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* SUBCATEGORÍAS (según categoría seleccionada) */}
      {incident.category ? (
        <>
          <Text style={styles.label}>Detalle</Text>
          {subOptions.length ? (
            <View style={styles.subcategoriesRow}>
              {subOptions.map((sub) => {
                const label = sub.name; // en Firestore {id,name}
                const isSelected = incident.subcategory === label;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.subcategoryItem,
                      isSelected && styles.subcategoryItemActive,
                    ]}
                    onPress={() => updateSubcategory(label)}
                  >
                    <Text
                      style={[
                        styles.subcategoryText,
                        isSelected && { color: '#fff' },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: colors.muted, marginBottom: 8 }}>
              No hay subcategorías configuradas para esta categoría.
            </Text>
          )}
        </>
      ) : null}

      {/* FOTOS */}
      <Text style={styles.label}>Fotos</Text>
      <View style={styles.mediaRow}>
        {incident.photos.map((p) => (
          <View key={p.uri} style={styles.mediaThumb}>
            <Image source={{ uri: p.uri }} style={styles.mediaImg} />
            <TouchableOpacity
              style={styles.mediaRemove}
              onPress={() => removePhoto(p.uri)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addMediaBtn}
          onPress={addPhotoFromGallery}
          disabled={busy}
        >
          <Ionicons name="image-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addMediaBtn}
          onPress={addPhotoFromCamera}
          disabled={busy}
        >
          <Ionicons name="camera-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* VIDEOS */}
      <Text style={styles.label}>Videos</Text>
      <View style={styles.mediaRow}>
        {incident.videos.map((v) => (
          <View key={v.uri} style={styles.mediaThumbVideo}>
            <Ionicons name="videocam" size={22} color="#fff" />
            <Text numberOfLines={1} style={styles.videoName}>
              {v.uri.split('/').pop()}
            </Text>
            <TouchableOpacity
              style={styles.mediaRemove}
              onPress={() => removeVideo(v.uri)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addMediaBtn}
          onPress={addVideo}
          disabled={busy}
        >
          <Ionicons name="videocam-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* UBICACIÓN */}
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
            <Marker coordinate={loc} title={incident.address || 'Ubicación'} />
          </MapView>
        </View>
      ) : null}

      {/* ENVIAR */}
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
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  label: { fontSize: 14, color: colors.text, marginBottom: 6, marginTop: 12 },

  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 110,
  },
  categoryItemActive: {
    backgroundColor: colors.primary,
  },
  categoryText: { color: colors.primary, fontWeight: '600', fontSize: 12 },

  subcategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subcategoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  subcategoryItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subcategoryText: { color: colors.text, fontSize: 12 },

  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaThumbVideo: {
    width: 110,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#111827',
    padding: 6,
    justifyContent: 'space-between',
  },
  videoName: { color: '#fff', fontSize: 10 },
  mediaRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 2,
  },
  addMediaBtn: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  coords: { color: colors.muted, marginBottom: 8 },

  btnSecondary: {
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

  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
