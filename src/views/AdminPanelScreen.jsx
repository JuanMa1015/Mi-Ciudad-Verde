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
  TextInput,
  ScrollView,
  Share, // fallback si no hay expo-sharing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ API legacy (evita deprecation crash)
// import * as Sharing from 'expo-sharing'; // ❌ no lo importamos fijo; lo cargamos dinámico

import {
  subscribeIncidents,
  updateIncidentDoc,
  deleteIncidentDoc,
  getDepartments,
  getUnitsByDepartment,
  assignIncidentTo,
  getCategoriesWithSubs,
} from '../services/firestoreService';
import { currentUser } from '../services/authService';

/* ========= Sugerencias por categoría → departamentos ========= */
const CATEGORY_DEPTS = {
  'Basura y residuos': ['aseo_emvarias'],
  'Árboles y zonas verdes': ['medio_ambiente', 'dagrd_bomberos'],
  Agua: ['epm_aguas', 'dagrd_bomberos'],
  'Vías / Tránsito': ['movilidad_medellin'],
  'Ruido y Contaminación': ['medio_ambiente', 'amva_area_metropolitana'],
};

/* ========= Estados y Colores ========= */
const STATUS = ['nuevo', 'en_proceso', 'resuelto', 'rechazado'];
const STATUS_WITH_ALL = ['todos', ...STATUS];

const STATUS_COLORS = {
  nuevo: { bg: '#F3F4F6', text: '#374151', chipBg: '#111827', chipText: '#FFFFFF' },
  en_proceso: { bg: '#E0F2FE', text: '#0369A1', chipBg: '#0EA5E9', chipText: '#FFFFFF' },
  resuelto: { bg: '#DCFCE7', text: '#15803D', chipBg: '#10B981', chipText: '#FFFFFF' },
  rechazado: { bg: '#FEE2E2', text: '#991B1B', chipBg: '#EF4444', chipText: '#FFFFFF' },
};

const DEPT_COLORS = {
  aseo_emvarias: { bg: '#FFF7ED', text: '#9A3412' },
  epm_aguas: { bg: '#ECFEFF', text: '#155E75' },
  movilidad_medellin: { bg: '#FFFBEB', text: '#92400E' },
  dagrd_bomberos: { bg: '#FEF2F2', text: '#9F1239' },
  medio_ambiente: { bg: '#F0FDF4', text: '#166534' },
  amva_area_metropolitana: { bg: '#ECFDF5', text: '#065F46' },
};

export default function AdminPanelScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Filtro superior
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales
  const [showEdit, setShowEdit] = useState(false);     // editar: categoría/subcategoría (pickers), dirección, descripción
  const [showAssign, setShowAssign] = useState(false); // asignar: estado + dept/unidad
  const [editingIncident, setEditingIncident] = useState(null);

  // ====== estado (para modal de asignación) ======
  const [status, setStatus] = useState('nuevo');

  // ====== catálogo asignación ======
  const [deptList, setDeptList] = useState([]);
  const [unitList, setUnitList] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Pickers asignación
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // ====== categorías desde Firestore (lo ve admin y user) ======
  const [categories, setCategories] = useState([]);     // [{id,name,subs:[{id,name}]}]
  const [catLoading, setCatLoading] = useState(true);

  // pickers cat/subcat
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showSubcatPicker, setShowSubcatPicker] = useState(false);

  // valores de edición
  const [editCategory, setEditCategory] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [saving, setSaving] = useState(false);

  // Datos (incidents)
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

  // Catálogo categorías/subcategorías Firestore
  useEffect(() => {
    (async () => {
      try {
        const data = await getCategoriesWithSubs();
        setCategories(data);
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'todos') return rows;
    return rows.filter((r) => (r.status || 'nuevo') === statusFilter);
  }, [rows, statusFilter]);

  const countText = useMemo(() => {
    const n = filteredRows.length;
    return n === 1 ? '1 reporte encontrado' : `${n} reportes encontrados`;
  }, [filteredRows]);

  /* =============== Exportar CSV (dentro del componente) =============== */
  function csvEscape(val) {
    if (val == null) return '';
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function incidentsToCsv(data) {
    const header = ['id','createdAt','status','category','subcategory','address','userEmail','assignedDept','assignedUnit'];
    const lines = [header.join(',')];
    for (const it of data) {
      const created = it.createdAt?.toDate
        ? it.createdAt.toDate().toISOString()
        : (it.createdAt || '');
      lines.push([
        csvEscape(it.id),
        csvEscape(created),
        csvEscape(String(it.status || '')),
        csvEscape(it.category || ''),
        csvEscape(it.subcategory || ''),
        csvEscape(it.address || ''),
        csvEscape(it.userEmail || ''),
        csvEscape(it.assignedDept || ''),
        csvEscape(it.assignedUnit || ''),
      ].join(','));
    }
    return '\uFEFF' + lines.join('\n'); // BOM UTF-8 para Excel
  }
  async function exportIncidentsCsv(list) {
    try {
      const data = list && list.length ? list : filteredRows;
      if (!data.length) return Alert.alert('Exportar', 'No hay reportes para exportar.');
      const csv = incidentsToCsv(data);
      const fileUri = FileSystem.documentDirectory + `reportes_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

      // Intento con expo-sharing si existe; si no, Share nativo
      let shared = false;
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar reportes' });
          shared = true;
        }
      } catch (_) {}
      if (!shared) {
        await Share.share({
          url: fileUri,
          message: 'Exportación de reportes',
          title: 'Exportar reportes',
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No fue posible exportar el CSV.');
    }
  }

  /* =============== EDITAR TODO =============== */
  function openEditAllModal(incident) {
    setEditingIncident(incident);
    setEditCategory(incident?.category || '');
    setEditSubcategory(incident?.subcategory || '');
    setEditAddress(incident?.address || '');
    setEditDescription(incident?.description || '');
    setShowEdit(true);
  }

  function handleCategorySelect(catId) {
    const found = categories.find((c) => c.id === catId);
    setEditCategory(found ? found.name : '');
    const subNames = new Set((found?.subs || []).map((s) => s.name));
    if (!subNames.has(editSubcategory)) setEditSubcategory('');
    setShowCatPicker(false);
  }

  function handleSubcategorySelect(subName) {
    setEditSubcategory(subName);
    setShowSubcatPicker(false);
  }

  async function handleSaveEditAll() {
    if (!editingIncident) return;
    try {
      setSaving(true);
      await updateIncidentDoc(editingIncident.id, {
        category: editCategory || '',
        subcategory: editSubcategory || '',
        address: editAddress || '',
        description: editDescription || '',
      });
      setShowEdit(false);
      setEditingIncident(null);
    } catch (e) {
      console.error('handleSaveEditAll', e);
      Alert.alert('Error', 'No fue posible guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  /* =============== ASIGNAR (estado + dept/unidad) =============== */
  async function openAssignModal(incident) {
    setEditingIncident(incident);
    setShowAssign(true);
    setStatus(incident?.status || 'nuevo');

    const all = await getDepartments();

    const allowed = CATEGORY_DEPTS[incident?.category] || null;
    const filtered = allowed ? all.filter((d) => allowed.includes(d.id)) : all;
    setDeptList(filtered);

    if (incident?.assignedDeptId) {
      const d = filtered.find((x) => x.id === incident.assignedDeptId) || null;
      setSelectedDept(d || null);
      const units = await getUnitsByDepartment(incident.assignedDeptId);
      setUnitList(units);
      if (incident?.assignedUnitId) {
        const u = units.find((x) => x.id === incident.assignedUnitId) || null;
        setSelectedUnit(u || null);
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

  async function handleSaveAssign() {
    if (!editingIncident) return;
    try {
      setSaving(true);

      const admin = currentUser();
      const ops = [];

      if (status !== editingIncident.status) {
        ops.push(updateIncidentDoc(editingIncident.id, { status }));
      }

      ops.push(
        assignIncidentTo(editingIncident.id, {
          deptId: selectedDept?.id || null,
          deptName: selectedDept?.name || null,
          unitId: selectedUnit?.id || null,
          unitName: selectedUnit?.name || null,
          adminEmail: admin?.email || null,
        })
      );

      await Promise.all(ops);

      setShowAssign(false);
      setEditingIncident(null);
    } catch (e) {
      console.error('handleSaveAssign', e);
      Alert.alert('Error', 'No fue posible guardar la asignación.');
    } finally {
      setSaving(false);
    }
  }

  /* =============== Eliminar =============== */
  function handleDelete(incident) {
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
        <Text style={{ color: colors.danger || '#ef4444' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F3FFF4' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 }}>
          Panel de administración
        </Text>

        {/* Filtro por estado */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          {STATUS_WITH_ALL.map((s) => {
            const active = statusFilter === s;
            const isAll = s === 'todos';
            const scheme = isAll ? { chipBg: '#111827', chipText: '#FFFFFF' } : (STATUS_COLORS[s] || STATUS_COLORS.nuevo);
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[
                  styles.chip,
                  active ? { backgroundColor: scheme.chipBg, borderColor: scheme.chipBg } : { backgroundColor: '#fff' },
                  { marginRight: 8, marginBottom: 8 },
                ]}
              >
                <Text style={{ color: active ? scheme.chipText : '#111827', fontWeight: '700' }}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* contador + Exportar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ color: '#6B7280' }}>{countText}</Text>
          <TouchableOpacity
            style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#10b981', paddingVertical:10, paddingHorizontal:12, borderRadius:12 }}
            onPress={() => exportIncidentsCsv(filteredRows)}
          >
            <Ionicons name="download" size={18} color="#fff" />
            <Text style={{ color:'#fff', fontWeight:'800', marginLeft:6 }}>Exportar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <IncidentCard
            item={item}
            onEditAll={() => openEditAllModal(item)}
            onAssign={() => openAssignModal(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: '#6B7280' }}>No hay reportes.</Text>
          </View>
        }
      />

      {/* ===== Modal: Editar todo ===== */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Editar reporte</Text>
            <Text style={{ color: '#6B7280', marginBottom: 12 }}>
              <Text>ID:</Text> <Text>{(editingIncident?.id || '').slice(0, 8)}…</Text>
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Categoría (picker) */}
              <Text style={styles.label}>Categoría</Text>
              <SelectField
                valueLabel={editCategory || (catLoading ? 'Cargando…' : 'Selecciona categoría')}
                disabled={catLoading}
                onPress={() => !catLoading && setShowCatPicker(true)}
              />

              {/* Subcategoría (picker dependiente) */}
              <Text style={[styles.label, { marginTop: 12 }]}>Subcategoría</Text>
              <SelectField
                valueLabel={
                  editCategory
                    ? (editSubcategory || 'Selecciona subcategoría')
                    : 'Selecciona una categoría primero'
                }
                disabled={!editCategory}
                onPress={() => editCategory && setShowSubcatPicker(true)}
              />

              {/* Dirección */}
              <Text style={[styles.label, { marginTop: 12 }]}>Dirección</Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Dirección"
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />

              {/* Descripción */}
              <Text style={[styles.label, { marginTop: 12 }]}>Descripción</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Describe el incidente…"
                multiline
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                placeholderTextColor="#9CA3AF"
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setShowEdit(false)}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
                onPress={handleSaveEditAll}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Modal: Asignar (estado + dept/unidad) ===== */}
      <Modal visible={showAssign} transparent animationType="slide" onRequestClose={() => setShowAssign(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Asignar reporte</Text>
            <Text style={{ color: '#6B7280', marginBottom: 12 }}>
              <Text>{editingIncident?.category}</Text>
              {editingIncident?.subcategory ? <Text>{' - '}{editingIncident.subcategory}</Text> : null}
            </Text>

            {/* Estado */}
            <Text style={styles.label}>Estado</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {STATUS.map((s) => {
                const active = status === s;
                const sc = STATUS_COLORS[s] || STATUS_COLORS.nuevo;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.chip,
                      active ? { backgroundColor: sc.chipBg, borderColor: sc.chipBg } : { backgroundColor: '#fff' },
                      { marginRight: 8, marginBottom: 8 },
                    ]}
                  >
                    <Text style={{ color: active ? sc.chipText : '#111827' }}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Departamento / Unidad */}
            <Text style={[styles.label, { marginTop: 8 }]}>Departamento</Text>
            <SelectField
              valueLabel={selectedDept ? (selectedDept.name || selectedDept.id) : 'Selecciona departamento'}
              disabled={false}
              onPress={() => setShowDeptPicker(true)}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Unidad</Text>
            <SelectField
              valueLabel={
                selectedUnit
                  ? (selectedUnit.name || selectedUnit.id)
                  : (selectedDept ? 'Selecciona unidad' : 'Selecciona un departamento primero')
              }
              disabled={!selectedDept}
              onPress={() => selectedDept && setShowUnitPicker(true)}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setShowAssign(false)}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, (!selectedDept || saving) && { opacity: 0.6 }]}
                onPress={handleSaveAssign}
                disabled={!selectedDept || saving}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker de Categoría */}
      <PickerModal
        visible={showCatPicker}
        title="Selecciona una categoría"
        options={categories.map((c) => ({ id: c.id, name: c.name }))}
        getKey={(x) => x.id}
        getLabel={(x) => x.name}
        onClose={() => setShowCatPicker(false)}
        onSelect={(it) => handleCategorySelect(it.id)}
      />

      {/* Picker de Subcategoría */}
      <PickerModal
        visible={showSubcatPicker}
        title="Selecciona una subcategoría"
        options={(categories.find((c) => c.name === editCategory)?.subs || [])}
        getKey={(x) => x.id}
        getLabel={(x) => x.name}
        onClose={() => setShowSubcatPicker(false)}
        onSelect={(it) => handleSubcategorySelect(it.name)}
      />

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
function IncidentCard({ item, onEditAll, onAssign, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={{ fontWeight: '800', marginBottom: 4 }}>
        {item.category}{item.subcategory ? ` - ${item.subcategory}` : ''}
      </Text>
      {item.address ? <Text style={styles.muted}>{item.address}</Text> : null}
      <Text style={styles.muted}>Autor: {item.userEmail || item.userId}</Text>
      {item.createdAt ? (
        <Text style={[styles.muted, { marginBottom: 8 }]}>
          {new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleString()}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <StatusBadge status={item.status} />
        {item.assignedDeptId ? (
          <DeptBadge deptId={item.assignedDeptId} deptName={item.assignedDept} />
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }} />
        <IconBtn name="create" color="#0ea5e9" onPress={onEditAll} />
        <IconBtn name="person-add" color="#8b5cf6" onPress={onAssign} />
        <IconBtn name="trash" color="#ef4444" onPress={onDelete} />
      </View>
    </View>
  );
}

/* ====== Badges ====== */
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.nuevo;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
      <Text style={{ color: c.text, fontWeight: '700' }}>{status || 'nuevo'}</Text>
    </View>
  );
}

function DeptBadge({ deptId, deptName }) {
  if (!deptId && !deptName) return null;
  const c = DEPT_COLORS[deptId] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        maxWidth: '75%',
      }}
    >
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: c.text, fontWeight: '600' }}>
        {deptName || deptId}
      </Text>
    </View>
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

/* ====== Campo select estilo input ====== */
function SelectField({ valueLabel, disabled, onPress }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.input,
        disabled && { backgroundColor: '#f3f4f6', opacity: 0.6 },
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
      ]}
    >
      <Text style={{ color: disabled ? '#9CA3AF' : '#111827' }} numberOfLines={1} ellipsizeMode="tail">
        {valueLabel}
      </Text>
      <Ionicons name="chevron-down" size={18} color={disabled ? '#9CA3AF' : '#111827'} />
    </TouchableOpacity>
  );
}

/* ====== Icono botón ====== */
function IconBtn({ name, color = '#111827', size = 22, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
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
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff', color:'#111827' },
  btnGhost: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6' },
  btnPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#16a34a' },
});
