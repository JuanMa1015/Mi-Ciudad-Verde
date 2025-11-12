// src/components/AssignmentPicker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const ASSIGN_GROUPS = [
  {
    id: 'bomberos',
    label: 'Bomberos',
    icon: 'flame',
    children: [
      { id: 'bomberos-est1', label: 'Estación 1' },
      { id: 'bomberos-est2', label: 'Estación 2' },
      { id: 'bomberos-forestal', label: 'Unidad forestal' },
    ],
  },
  {
    id: 'aseo',
    label: 'Aseo / Emvarias',
    icon: 'trash',
    children: [
      { id: 'aseo-recoleccion', label: 'Recolección' },
      { id: 'aseo-podado', label: 'Podado' },
      { id: 'aseo-escombro', label: 'Escombros' },
    ],
  },
  {
    id: 'transito',
    label: 'Tránsito',
    icon: 'car',
    children: [
      { id: 'transito-agentes', label: 'Agentes' },
      { id: 'transito-señales', label: 'Señalización' },
    ],
  },
  {
    id: 'ambiental',
    label: 'Ambiental',
    icon: 'leaf',
    children: [
      { id: 'ambiental-ruido', label: 'Ruido' },
      { id: 'ambiental-fauna', label: 'Fauna' },
    ],
  },
  {
    id: 'otro',
    label: 'Otro',
    icon: 'help-circle',
    children: [],
  },
];

export default function AssignmentPicker({ value, onChange }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <View>
      <Text style={styles.label}>Asignar a</Text>
      <View style={styles.row}>
        {ASSIGN_GROUPS.map((g) => {
          const active = selectedGroup === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setSelectedGroup(g.id);
                // si el grupo no tiene hijos, seteamos directamente
                if (!g.children?.length) {
                  onChange?.({ groupId: g.id, groupLabel: g.label, unitId: null, unitLabel: null });
                }
              }}
            >
              <Ionicons
                name={g.icon}
                size={18}
                color={active ? '#fff' : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chipText, active && { color: '#fff' }]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* subopciones */}
      {selectedGroup ? (
        <View style={{ marginTop: 10 }}>
          {ASSIGN_GROUPS.find((g) => g.id === selectedGroup)?.children?.map((child) => {
            const isSelected =
              value?.unitId === child.id && value?.groupId === selectedGroup;
            return (
              <TouchableOpacity
                key={child.id}
                style={[styles.subItem, isSelected && styles.subItemActive]}
                onPress={() =>
                  onChange?.({
                    groupId: selectedGroup,
                    groupLabel:
                      ASSIGN_GROUPS.find((g) => g.id === selectedGroup)?.label ||
                      '',
                    unitId: child.id,
                    unitLabel: child.label,
                  })
                }
              >
                <Text style={[styles.subText, isSelected && { color: '#fff' }]}>
                  {child.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* resumen */}
      {value?.groupLabel ? (
        <Text style={styles.summary}>
          Asignado a: {value.groupLabel}
          {value.unitLabel ? ` → ${value.unitLabel}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  subItem: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  subItemActive: {
    backgroundColor: colors.primary,
  },
  subText: {
    color: colors.text,
  },
  summary: {
    marginTop: 10,
    color: colors.muted,
  },
});
