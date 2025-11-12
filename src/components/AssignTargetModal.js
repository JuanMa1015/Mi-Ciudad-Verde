// src/components/AssignTargetModal.jsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { getDepartments, getUnitsByDepartment } from '../services/firestoreService';

export default function AssignTargetModal({ visible, onClose, onConfirm }) {
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) return;
    const load = async () => {
      setLoadingDeps(true);
      try {
        const deps = await getDepartments();
        setDepartments(deps);
      } catch (e) {
        console.log('[AssignModal] deps error', e);
      } finally {
        setLoadingDeps(false);
      }
    };
    load();
    setSelectedDept(null);
    setSelectedUnit(null);
    setUnits([]);
    setSearch('');
  }, [visible]);

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    setSelectedUnit(null);
    setLoadingUnits(true);
    try {
      const list = await getUnitsByDepartment(dept.id);
      setUnits(list);
    } catch (e) {
      console.log('[AssignModal] units error', e);
    } finally {
      setLoadingUnits(false);
    }
  };

  const filteredUnits = units.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Asignar a</Text>

          <Text style={styles.label}>Departamento</Text>
          {loadingDeps ? (
            <ActivityIndicator />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {departments.map((dep) => (
                <TouchableOpacity
                    key={dep.id}
                    style={[
                      styles.chip,
                      selectedDept?.id === dep.id && styles.chipActive,
                    ]}
                    onPress={() => handleSelectDept(dep)}
                  >
                    <Ionicons
                      name={dep.icon || 'business'}
                      size={16}
                      color={selectedDept?.id === dep.id ? '#fff' : colors.text}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: selectedDept?.id === dep.id ? '#fff' : colors.text,
                      }}
                    >
                      {dep.name}
                    </Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedDept ? (
            <>
              <Text style={styles.label}>Unidad dentro de {selectedDept.name}</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar unidad..."
                style={styles.search}
              />
              {loadingUnits ? (
                <ActivityIndicator />
              ) : filteredUnits.length === 0 ? (
                <Text style={{ color: colors.muted, marginTop: 4 }}>
                  No hay unidades registradas.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 160, marginTop: 6 }}>
                  {filteredUnits.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.unitRow,
                        selectedUnit?.id === u.id && styles.unitRowActive,
                      ]}
                      onPress={() => setSelectedUnit(u)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={selectedUnit?.id === u.id ? '#fff' : colors.text}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: selectedUnit?.id === u.id ? '#fff' : colors.text,
                        }}
                      >
                        {u.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <Text style={{ color: colors.muted, marginBottom: 6 }}>
              Selecciona primero un departamento
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
              <Text style={{ color: colors.text }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!selectedDept) return;
                onConfirm?.({
                  deptId: selectedDept.id,
                  deptName: selectedDept.name,
                  unitId: selectedUnit?.id || null,
                  unitName: selectedUnit?.name || null,
                });
              }}
              style={[
                styles.btn,
                { backgroundColor: colors.primary },
                !selectedDept && { opacity: 0.4 },
              ]}
              disabled={!selectedDept}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Asignar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#22C55E',
  },
  search: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
  },
  unitRowActive: {
    backgroundColor: '#22C55E',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  btnSecondary: {
    backgroundColor: '#E5E7EB',
  },
});
