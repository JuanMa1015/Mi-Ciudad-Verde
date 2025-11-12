// src/views/ReportsListScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import colors from '../theme/colors';
import useMapViewModel from '../viewmodels/useMapViewModel'; // fuente única: todos los reportes
import { deleteIncidentDoc } from '../services/firestoreService';
import { currentUser } from '../services/authService';

export default function ReportsListScreen({ navigation }) {
  // Toggle de filtro
  const [showMine, setShowMine] = useState(true);

  // VM única (todos los reportes)
  const { incidents: allIncidents, loading, error } = useMapViewModel();

  // Usuario actual
  const me = currentUser();
  const uid = me?.uid ?? null;
  const email = me?.email?.toLowerCase?.() ?? null;

  // Filtrar en memoria cuando "Mis reportes" está ON
  const filteredIncidents = useMemo(() => {
    if (!showMine) return allIncidents;

    if (!uid && !email) return []; // sin identidad, no podemos filtrar "míos"

    return (allIncidents || []).filter((it) => {
      const byUid = it?.userId && it.userId === uid;
      const byEmail =
        email &&
        typeof it?.userEmail === 'string' &&
        it.userEmail.toLowerCase() === email;
      return byUid || byEmail;
    });
  }, [showMine, allIncidents, uid, email]);

  // Eliminar
  const handleDelete = (item) => {
    Alert.alert('Eliminar reporte', '¿Seguro que quieres eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncidentDoc(item.id);
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'No fue posible eliminar el reporte.');
          }
        },
      },
    ]);
  };

  // Fecha segura
  const formatDate = (createdAt) => {
    // soporta number (ms), Timestamp.toMillis(), o nada
    const ms =
      typeof createdAt === 'number'
        ? createdAt
        : createdAt?.toMillis?.() ?? (createdAt?.seconds ? createdAt.seconds * 1000 : null);
    return ms ? new Date(ms).toLocaleString() : '';
  };

  // Autor (texto)
  const renderAuthor = (item) => {
    const authorEmail = item?.userEmail || '';
    const authorName = item?.userName || (authorEmail ? authorEmail.split('@')[0] : null);
    if (!authorEmail && !authorName) return null;

    const isMine =
      !!email &&
      typeof authorEmail === 'string' &&
      authorEmail.toLowerCase() === email;

    return <Text style={styles.author}>{isMine ? '📍 Reportado por ti' : `📍 Reportado por ${authorName}`}</Text>;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: colors.muted, marginTop: 8 }}>Cargando reportes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#DC2626' }}>No fue posible cargar reportes.</Text>
      </View>
    );
  }

  const data = filteredIncidents || [];

  return (
    <View style={{ flex: 1 }}>
      {/* Header + toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{showMine ? 'Mis reportes' : 'Todos'}</Text>
          <Switch
            value={showMine}
            onValueChange={setShowMine}
            thumbColor={showMine ? colors.primary : '#ccc'}
            trackColor={{ true: `${colors.primary}55`, false: '#e5e7eb' }}
          />
        </View>
      </View>

      {/* Aviso cuando no hay "míos" pero sí existen públicos */}
      {showMine && data.length === 0 && (allIncidents?.length || 0) > 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            No encontramos reportes tuyos. Cambia a “Todos” para ver los públicos.
          </Text>
          <TouchableOpacity onPress={() => setShowMine(false)} style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Lista */}
      {data.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>
            {showMine ? 'Aún no has creado reportes.' : 'No hay reportes registrados.'}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}
          data={data}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const canDelete =
              showMine &&
              ((item?.userId && item.userId === uid) ||
                (email &&
                  typeof item?.userEmail === 'string' &&
                  item.userEmail.toLowerCase() === email));

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportDetail', { id: item.id })}
                activeOpacity={0.85}
              >
                <View style={styles.card}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                  ) : null}

                  <Text style={styles.desc}>{item.description || 'Sin descripción'}</Text>

                  <Text style={styles.coords}>
                    {item.address
                      ? item.address
                      : `Lat: ${item.location?.latitude?.toFixed?.(5) ?? '—'}  Lng: ${
                          item.location?.longitude?.toFixed?.(5) ?? '—'
                        }`}
                  </Text>

                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

                  {renderAuthor(item)}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ReportDetail', { id: item.id })}
                      style={[styles.btn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.btnText}>Ver</Text>
                    </TouchableOpacity>

                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        style={[styles.btn, { backgroundColor: '#DC2626' }]}
                      >
                        <Text style={styles.btnText}>Eliminar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB crear reporte */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.fabText}>+ Reporte</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { color: colors.text, fontWeight: '600', marginRight: 8 },

  banner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    margin: 12,
    borderRadius: 12,
    padding: 12,
  },
  bannerText: { color: '#92400E', marginBottom: 8 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerBtnText: { color: '#fff', fontWeight: '700' },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photo: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  desc: { color: colors.text, marginBottom: 4, fontWeight: '600' },
  coords: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  date: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  author: { color: colors.muted, fontSize: 12, marginBottom: 2 },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnText: { color: '#fff', fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
    elevation: 5,
  },
  fabText: { color: '#fff', fontWeight: '800' },
});
