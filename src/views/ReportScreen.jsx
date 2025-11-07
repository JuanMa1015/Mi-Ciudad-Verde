// src/views/ReportScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import useReportViewModel from '../viewmodels/useReportViewModel';

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

  // categorías que vamos a mostrar (puedes cambiar nombres)
  const categories = [
    {
      id: 'waste',
      name: 'Basura',
      icon: 'trash-outline',
      subcategories: ['Bolsa rota', 'Escombros', 'Contenedor lleno', 'Quema'],
    },
    {
      id: 'green',
      name: 'Áreas verdes',
      icon: 'leaf-outline',
      subcategories: ['Árbol caído', 'Poda requerida', 'Daño en parque', 'Riesgo en árbol'],
    },
    {
      id: 'water',
      name: 'Agua',
      icon: 'water-outline',
      subcategories: ['Fuga', 'Inundación', 'Aguas negras', 'Charco permanente'],
    },
    {
      id: 'noise',
      name: 'Ruido',
      icon: 'volume-high-outline',
      subcategories: ['Comercio', 'Obra', 'Vehículos', 'Fiesta'],
    },
  ];

  const selectedCategory = categories.find(
    (c) => c.name === incident.category
  );

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo reporte</Text>
      <Text style={styles.subtitle}>
        Selecciona el tipo de problema y agrega evidencia
      </Text>

      {/* CATEGORÍAS */}
      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categoriesRow}>
        {categories.map((cat) => {
          const isSelected = incident.category === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
              onPress={() => updateCategory(cat.name)}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={isSelected ? '#fff' : colors.primary}
                style={{ marginBottom: 4 }}
              />
              <Text
                style={[
                  styles.categoryText,
                  isSelected && { color: '#fff' },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SUBCATEGORÍAS (solo de la seleccionada) */}
      {selectedCategory ? (
        <>
          <Text style={styles.label}>Detalle</Text>
          <View style={styles.subcategoriesRow}>
            {selectedCategory.subcategories.map((sub) => {
              const isSelected = incident.subcategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.subcategoryItem,
                    isSelected && styles.subcategoryItemActive,
                  ]}
                  onPress={() => updateSubcategory(sub)}
                >
                  <Text
                    style={[
                      styles.subcategoryText,
                      isSelected && { color: '#fff' },
                    ]}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
    minWidth: 90,
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
