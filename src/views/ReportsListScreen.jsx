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
import useReportsListViewModel from '../viewmodels/useReportsListViewModel'; // solo mis reportes (where userId==uid)
import useMapViewModel from '../viewmodels/useMapViewModel'; // todos los reportes
import { deleteIncidentDoc } from '../services/firestoreService';
import { currentUser } from '../services/authService';

export default function ReportsListScreen({ navigation }) {
  const [showMine, setShowMine] = useState(true);
  const myVM = useReportsListViewModel();
  const publicVM = useMapViewModel();

  const user = currentUser();
  const uid = user?.uid ?? null;
  const email = user?.email ?? null;

  // Fallback: si "Mis reportes" está vacío (p.ej. reportes viejos sin userId),
  // filtramos localmente los públicos por userId==uid o userEmail==email.
  const mineWithFallback = useMemo(() => {
    if (!uid && !email) return myVM.incidents;
    if (myVM.incidents.length > 0) return myVM.incidents;

    const filtered = publicVM.incidents.filter((it) => {
      return (it.userId && it.userId === uid) || (it.userEmail && it.userEmail === email);
    });
    return filtered;
  }, [myVM.incidents, publicVM.incidents, uid, email]);

  const loading = showMine ? (myVM.loading || publicVM.loading) : publicVM.loading;
  const incidents = showMine ? mineWithFallback : publicVM.incidents;

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar reporte',
      '¿Seguro que quieres eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIncidentDoc(id);
            } catch (err) {
              Alert.alert('Error', 'No fue posible eliminar el reporte.');
            }
          },
        },
      ]
    );
  };

  // Función auxiliar para formatear fecha
  const formatDate = (createdAt) => {
    const ms =
      typeof createdAt === 'number'
        ? createdAt
        : createdAt?.toMillis?.() ?? null;
    return ms ? new Date(ms).toLocaleString() : '';
  };

  // Función para mostrar autor
  const renderAuthor = (item) => {
    const authorEmail = item?.userEmail || '';
    const authorName = item?.userName || (authorEmail ? authorEmail.split('@')[0] : null);
    if (!authorEmail && !authorName) return null;

    const isMine = email && authorEmail && authorEmail.toLowerCase() === email.toLowerCase();

    return (
      <Text style={styles.author}>
        📍 {isMine ? 'Reportado por ti' : `Reportado por ${authorName}`}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Cargando reportes...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header con filtro */}
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            {showMine ? 'Mis reportes' : 'Todos'}
          </Text>
          <Switch
            value={showMine}
            onValueChange={setShowMine}
            thumbColor={showMine ? colors.primary : '#ccc'}
            trackColor={{ true: colors.primary + '55', false: '#e5e7eb' }}
          />
        </View>
      </View>

      {/* Aviso si no hay resultados en "Mis reportes" pero sí existen públicos */}
      {showMine && mineWithFallback.length === 0 && publicVM.incidents.length > 0 ? (
        <View style={[styles.banner]}>
          <Text style={styles.bannerText}>
            No encontramos reportes tuyos. Cambia a “Todos” para ver los públicos.
          </Text>
          <TouchableOpacity onPress={() => setShowMine(false)} style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Lista */}
      {incidents.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>
            {showMine
              ? 'Aún no has creado reportes.'
              : 'No hay reportes registrados.'}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}
          data={incidents}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const canDelete = showMine && item.userId && item.userId === uid;

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportDetail', { incident: item })}
                activeOpacity={0.85}
              >
                <View style={styles.card}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                  ) : null}

                  <Text style={styles.desc}>
                    {item.description || 'Sin descripción'}
                  </Text>

                  <Text style={styles.coords}>
                    {item.address
                      ? item.address
                      : `Lat: ${item.location?.latitude?.toFixed?.(5) ?? '—'}  Lng: ${
                          item.location?.longitude?.toFixed?.(5) ?? '—'
                        }`}
                  </Text>

                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

                  {/* Mostrar autor en cualquier vista */}
                  {renderAuthor(item)}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('ReportDetail', { incident: item })
                      }
                      style={[styles.btn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.btnText}>Ver</Text>
                    </TouchableOpacity>

                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Report')}
      >
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
