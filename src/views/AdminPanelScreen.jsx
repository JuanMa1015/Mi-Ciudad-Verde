// src/views/AdminPanelScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import {
  subscribeIncidents,
  updateIncidentDoc,
  deleteIncidentDoc,
  getDepartments,
  getUnitsByDepartment,
  assignIncidentTo,
} from '../services/firestoreService';
import { currentUser } from '../services/authService';

/* ========= SUGERENCIAS por categoría → departamentos ========= */
const CATEGORY_DEPTS = {
  'Basura y residuos': ['aseo_emvarias'],
  'Árboles y zonas verdes': ['medio_ambiente', 'dagrd_bomberos'],
  'Agua / Inundaciones': ['epm_aguas', 'dagrd_bomberos'],
  'Ruido / Contaminación': ['medio_ambiente', 'amva_area_metropolitana'],
  'Vías / Tránsito': ['movilidad_medellin'],
};

const STATUS = ['nuevo', 'en_proceso', 'resuelto', 'rechazado'];

export default function AdminPanelScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Edición
  const [showEdit, setShowEdit] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [status, setStatus] = useState('nuevo');

  // Catálogos
  const [deptList, setDeptList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Pickers
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeIncidents({
      scope: 'all',
      onData: (list) => {
        setRows(list);
        setLoading(false);
      },
      onError: (e) => {
        console.error(e);
        setError('No fue posible cargar reportes.');
        setLoading(false);
      },
    });
    return () => unsub && unsub();
  }, []);

  const countText = useMemo(() => {
    const n = rows.length;
    return n === 1 ? '1 reporte encontrado' : `${n} reportes encontrados`;
  }, [rows]);

  async function openEditModal(incident) {
    setEditingIncident(incident);
    setStatus(incident?.status || 'nuevo');
    setShowEdit(true);

    // 1) traer departamentos
    const all = await getDepartments();

    // 2) filtrar por categoría
    const allowed = CATEGORY_DEPTS[incident?.category] || null;
    const filtered = allowed ? all.filter((d) => allowed.includes(d.id)) : all;
    setDeptList(filtered);

    // 3) precargar selección si ya tiene asignación
    if (incident?.assignedDeptId) {
      const d = filtered.find((x) => x.id === incident.assignedDeptId) || null;
      setSelectedDept(d);
      const units = await getUnitsByDepartment(incident.assignedDeptId);
      setUnitList(units);
      if (incident?.assignedUnitId) {
        const u = units.find((x) => x.id === incident.assignedUnitId) || null;
        setSelectedUnit(u);
      } else {
        setSelectedUnit(null);
      }
    } else {
      setSelectedDept(null);
      setUnitList([]);
      setSelectedUnit(null);
    }
  }

  async function handleDeptChange(dept) {
    setSelectedDept(dept);
    setSelectedUnit(null);
    if (!dept) {
      setUnitList([]);
      return;
    }
    const units = await getUnitsByDepartment(dept.id);
    setUnitList(units);
  }

  async function handleSave() {
    if (!editingIncident) return;
    try {
      setSaving(true);

      // 1) Actualiza estado (si cambió)
      if (status !== editingIncident.status) {
        await updateIncidentDoc(editingIncident.id, { status });
      }

      // 2) Asignación por catálogo
      const admin = currentUser();
      await assignIncidentTo(editingIncident.id, {
        deptId: selectedDept?.id || null,
        deptName: selectedDept?.name || null,
        unitId: selectedUnit?.id || null,
        unitName: selectedUnit?.name || null,
        adminEmail: admin?.email || null,
      });

      setShowEdit(false);
      setEditingIncident(null);
    } catch (e) {
      console.error('handleSave', e);
      Alert.alert('Error', 'No fue posible guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(incident) {
    Alert.alert('Eliminar', '¿Deseas eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncidentDoc(incident.id);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No fue posible eliminar.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 }}>
          Panel de administración
        </Text>
        <Text style={{ color: '#6B7280' }}>{countText}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => <IncidentCard item={item} onEdit={() => openEditModal(item)} onDelete={() => handleDelete(item)} />}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: '#6B7280' }}>No hay reportes.</Text>
          </View>
        }
      />

      {/* ===== Modal de edición ===== */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Editar reporte</Text>
            <Text style={{ color: '#6B7280', marginBottom: 12 }}>
              {editingIncident?.category} {editingIncident?.subcategory ? `- ${editingIncident.subcategory}` : ''}
            </Text>

            {/* Estado */}
            <Text style={styles.label}>Estado</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {STATUS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.chip,
                    status === s ? { backgroundColor: colors.primary } : { backgroundColor: '#fff' },
                  ]}
                >
                  <Text style={{ color: status === s ? '#fff' : '#111827' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Asignación */}
            <View style={{ height: 16 }} />
            <Text style={styles.label}>Asignar</Text>

            <Text style={styles.subLabel}>Departamento</Text>
            <TouchableOpacity
              onPress={() => setShowDeptPicker(true)}
              style={styles.input}
            >
              <Text style={{ color: selectedDept ? '#111827' : '#9CA3AF' }}>
                {selectedDept ? (selectedDept.name || selectedDept.id) : 'Selecciona departamento'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.subLabel, { marginTop: 12 }]}>Unidad</Text>
            <TouchableOpacity
              disabled={!selectedDept}
              onPress={() => setShowUnitPicker(true)}
              style={[
                styles.input,
                !selectedDept && { backgroundColor: '#f3f4f6', opacity: 0.6 },
              ]}
            >
              <Text style={{ color: selectedUnit ? '#111827' : '#9CA3AF' }}>
                {selectedUnit
                  ? (selectedUnit.name || selectedUnit.id)
                  : (selectedDept ? 'Selecciona unidad' : 'Selecciona un departamento primero')}
              </Text>
            </TouchableOpacity>

            {/* Botones */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setShowEdit(false)}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, (!selectedDept || saving) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={!selectedDept || saving}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker de Departamentos */}
      <PickerModal
        visible={showDeptPicker}
        title="Selecciona un departamento"
        options={deptList}
        getKey={(x) => x.id}
        getLabel={(x) => x.name || x.id}
        onClose={() => setShowDeptPicker(false)}
        onSelect={(d) => handleDeptChange(d)}
      />

      {/* Picker de Unidades */}
      <PickerModal
        visible={showUnitPicker}
        title="Selecciona una unidad"
        options={unitList}
        getKey={(x) => x.id}
        getLabel={(x) => x.name || x.id}
        onClose={() => setShowUnitPicker(false)}
        onSelect={(u) => setSelectedUnit(u)}
      />
    </View>
  );
}

/* ====== Card de incidente ====== */
function IncidentCard({ item, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={{ fontWeight: '800', marginBottom: 4 }}>
        {item.category}{item.subcategory ? ` - ${item.subcategory}` : ''}
      </Text>
      {item.address ? (
        <Text style={styles.muted}>{item.address}</Text>
      ) : null}
      <Text style={styles.muted}>Cat: {item.category}{item.subcategory ? ` • Sub: ${item.subcategory}` : ''}</Text>
      <Text style={styles.muted}>Autor: {item.userEmail || item.userId}</Text>
      {item.createdAt ? (
        <Text style={[styles.muted, { marginBottom: 8 }]}>{new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleString()}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={item.status} />
        <View style={{ flex: 1 }} />
        <IconBtn name="eye" color="#10b981" onPress={onEdit} />
        <IconBtn name="create" color="#0ea5e9" onPress={onEdit} />
        <IconBtn name="trash" color="#ef4444" onPress={onDelete} />
      </View>
    </View>
  );
}

function StatusBadge({ status }) {
  const map = {
    nuevo: '#9CA3AF',
    en_proceso: '#0ea5e9',
    resuelto: '#10b981',
    rechazado: '#ef4444',
  };
  return (
    <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
      <Text style={{ color: map[status] || '#6B7280', fontWeight: '700' }}>{status || 'nuevo'}</Text>
    </View>
  );
}

function IconBtn({ name, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      <Ionicons name={name} size={22} color={color} />
    </TouchableOpacity>
  );
}

/* ====== Picker genérico ====== */
function PickerModal({ visible, title, options, onClose, onSelect, getKey, getLabel }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.listSheet}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 16, fontWeight: '800' }}>{title}</Text>
          </View>
          {options?.length ? (
            <FlatList
              data={options}
              keyExtractor={(item) => String(getKey(item))}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); onClose(); }}
                  style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }}
                >
                  <Text style={{ fontSize: 15 }}>{getLabel(item)}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#6B7280' }}>No hay opciones.</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ====== Estilos ====== */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  muted: { color: '#6B7280', marginBottom: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '90%' },
  listSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  label: { fontWeight: '700', fontSize: 14, marginBottom: 8 },
  subLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  btnGhost: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6' },
  btnPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#16a34a' },
});
